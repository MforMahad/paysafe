import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ElavonApiError,
  collectMissingEnvIssues,
  elavonFetch,
  fetchElavonPaymentLink,
  isSettledStatus,
  markPaymentLinkAsPaid,
  type VerifiablePaymentLink,
} from '@/lib/payment-verification';

// Elavon's Converge/payment-links endpoint rejects strict JSON validation
// failures with a generic "badRequest" message. Keep the merchant-facing
// description short and free of control/special characters that trip that
// validation. Limit to 100 chars as required.
function sanitizeDescription(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    // Strip control characters (0x00-0x1F and 0x7F) that Converge rejects.
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    // Collapse runs of whitespace and trim the edges.
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Hosted payment page URL from an Elavon payment-link resource. */
function getCheckoutUrl(session: Record<string, unknown>): string | null {
  const candidate = session.url ?? session.href;
  return typeof candidate === 'string' && candidate ? candidate : null;
}

/** Statuses after which an Elavon payment link can no longer take a payment. */
const CLOSED_SESSION_STATUSES = new Set(['expired', 'cancelled', 'canceled', 'inactive', 'closed', 'disabled']);

/** Minimum remaining lifetime for a session to be handed out again. */
const SESSION_REUSE_MARGIN_MS = 5 * 60 * 1000;

/**
 * Whether an existing (unpaid) Elavon session can be handed to the customer
 * again instead of creating a new one.
 */
function isReusableSession(session: Record<string, unknown>): boolean {
  if (!getCheckoutUrl(session)) return false;

  const status = typeof session.status === 'string' ? session.status.toLowerCase() : '';
  if (CLOSED_SESSION_STATUSES.has(status) || session.isActive === false) return false;

  if (typeof session.expiresAt === 'string') {
    const expiresAt = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt - Date.now() < SESSION_REUSE_MARGIN_MS) return false;
  }

  return true;
}

type SessionCheck =
  | { kind: 'reuse'; checkoutUrl: string; paymentId: string }
  | { kind: 'paid' }
  | { kind: 'create' }
  | { kind: 'error'; message: string; status: number };

/**
 * Inspect the session currently stored on the link. A customer may have the
 * HPP open in another tab, so a live session is reused rather than replaced:
 * replacing it would make every verification path check the wrong session.
 */
async function checkExistingSession(
  supabase: ReturnType<typeof createAdminClient>,
  link: VerifiablePaymentLink
): Promise<SessionCheck> {
  if (!link.gateway_payment_id) {
    return { kind: 'create' };
  }

  let session: Record<string, unknown>;
  try {
    session = await fetchElavonPaymentLink(link.gateway_payment_id);
  } catch (err: unknown) {
    if (err instanceof ElavonApiError && err.status === 404) {
      // Elavon no longer knows this session, so nothing can be paid on it.
      return { kind: 'create' };
    }

    // Fail closed: creating a new session here could orphan a paid one.
    console.error(
      `[payments/start] Could not check existing session ${link.gateway_payment_id} for link ${link.id}:`,
      err
    );
    return {
      kind: 'error',
      message: 'Unable to reach the payment gateway. Please try again.',
      status: 502,
    };
  }

  if (isSettledStatus(session.status)) {
    // Paid in another tab but not yet recorded: record it now.
    const recorded = await markPaymentLinkAsPaid(supabase, link, session);
    if (!recorded) {
      console.error(
        `[payments/start] Session ${link.gateway_payment_id} is settled but link ${link.id} could not be marked paid.`
      );
    }
    return { kind: 'paid' };
  }

  const checkoutUrl = getCheckoutUrl(session);
  if (checkoutUrl && isReusableSession(session)) {
    return { kind: 'reuse', checkoutUrl, paymentId: link.gateway_payment_id };
  }

  return { kind: 'create' };
}

export async function GET(request: Request) {
  // ---------------------------------------------------------------------------
  // 0. Environment sanity check.
  //    Netlify serverless functions fail silently when an env var is missing
  //    from the site configuration, so we surface that explicitly in logs.
  // ---------------------------------------------------------------------------
  const missingEnv = collectMissingEnvIssues();
  if (missingEnv.length > 0) {
    missingEnv.forEach((issue) => console.error(`[payments/start] ${issue}`));
    return NextResponse.json(
      { error: 'Server misconfiguration. Please contact support.' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const rawToken = url.searchParams.get('token');

  if (!rawToken) {
    return NextResponse.json({ error: 'Payment token is required.' }, { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // 1. Resolve the public base URL for the return redirect.
  //    Priority:
  //      a. NEXT_PUBLIC_APP_URL (explicit production override)
  //      b. request Origin header (set by the browser on live traffic)
  //      c. x-forwarded-host / host headers (behind Netlify's proxy)
  //    This guarantees Elavon redirects back to the live production return
  //    page (/pay/[token]/return) instead of localhost.
  // ---------------------------------------------------------------------------
  const originHeader = request.headers.get('origin');
  const forwardedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ||
    (forwardedHost?.includes('localhost') ? 'http' : 'https');

  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  const derivedBaseUrl = originHeader
    ? originHeader.replace(/\/$/, '')
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : undefined;

  const baseUrl = configuredBaseUrl || derivedBaseUrl;

  if (!baseUrl) {
    console.error(
      '[payments/start] Unable to resolve application base URL for return redirect. ' +
        'Set NEXT_PUBLIC_APP_URL or ensure the request includes an Origin/Host header.'
    );
    return NextResponse.json(
      { error: 'Server misconfiguration: cannot determine return URL.' },
      { status: 500 }
    );
  }

  // The return page verifies the transaction on the fly and updates the DB.
  const returnUrl = `${baseUrl}/pay/${encodeURIComponent(rawToken)}/return`;

  // Service-role client with no cookies so the gateway_payment_id write below is
  // never downgraded to a logged-in user's RLS context.
  const supabase = createAdminClient();

  const { data: linkData, error: linkError } = await supabase
    .from('payment_links')
    .select('*')
    .eq('link_token', rawToken)
    .maybeSingle();

  if (linkError || !linkData) {
    console.error('[payments/start] Supabase lookup error:', linkError);
    return NextResponse.json({ error: 'Payment link not found in database.' }, { status: 404 });
  }

  // Prevent duplicate payment: single-use link protection
  if (linkData.status === 'paid' || linkData.paid_at) {
    return NextResponse.json(
      { error: 'This payment link has already been settled and completed.' },
      { status: 400 }
    );
  }

  if (linkData.status === 'cancelled') {
    return NextResponse.json(
      { error: 'This payment link has been cancelled.' },
      { status: 400 }
    );
  }

  if (
    linkData.status === 'expired' ||
    (linkData.expires_at && new Date(linkData.expires_at).getTime() <= Date.now())
  ) {
    return NextResponse.json(
      { error: 'This payment link has expired.' },
      { status: 400 }
    );
  }

  const link = linkData as unknown as VerifiablePaymentLink;
  const previousGatewayId: string | null = link.gateway_payment_id ?? null;

  // ---------------------------------------------------------------------------
  // 2. Reuse a live session instead of overwriting it.
  // ---------------------------------------------------------------------------
  const existing = await checkExistingSession(supabase, link);

  if (existing.kind === 'reuse') {
    return NextResponse.json({
      success: true,
      checkout_url: existing.checkoutUrl,
      payment_id: existing.paymentId,
      reused: true,
    });
  }

  if (existing.kind === 'paid') {
    return NextResponse.json(
      { error: 'This payment link has already been settled and completed.' },
      { status: 400 }
    );
  }

  if (existing.kind === 'error') {
    return NextResponse.json({ error: existing.message }, { status: existing.status });
  }

  // ---------------------------------------------------------------------------
  // 3. Create a new Elavon session.
  // ---------------------------------------------------------------------------
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const elavonRes = await elavonFetch('/payment-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expiresAt: expirationDate.toISOString(),
        total: {
          amount: Number(linkData.amount).toFixed(2),
          currencyCode: linkData.currency || 'USD',
        },
        // Correlate the Elavon session back to this payment link using the
        // documented orderReference field (NOT a custom "reference" key, which
        // Converge rejects with "Unrecognized field name").
        orderReference: linkData.link_token,
        orderReferenceLabel: 'Order',
        // Sanitized + length-capped description to satisfy strict validation.
        description: sanitizeDescription(linkData.description),
        // Dynamically resolved, absolute return URL so Elavon sends the customer
        // back to the live production return page after completing payment.
        returnUrl,
      }),
    });

    // Read the raw body as text first so we can log EXACTLY what Elavon
    // returned even when the body is not valid JSON (some gateway errors come
    // back as HTML or plain text from the proxy layer).
    const rawBody = await elavonRes.text();

    if (!elavonRes.ok) {
      console.error(
        `[payments/start] Elavon rejected session creation. ` +
          `HTTP ${elavonRes.status} ${elavonRes.statusText}. Raw response body:\n${rawBody}`
      );

      let failureMessage = 'Failed to create payment session.';
      try {
        const parsed = JSON.parse(rawBody);
        // Elavon returns { failures: [{ code, description, field }, ...] }.
        const failures = Array.isArray(parsed?.failures) ? parsed.failures : [];
        if (failures.length > 0) {
          failureMessage = failures
            .map(
              (f: { code?: string; description?: string; field?: string | null }) =>
                `${f.code || 'error'}${f.field ? ` (field: ${f.field})` : ''}: ${f.description || ''}`
            )
            .join(' | ');
        }
      } catch {
        // Body was not JSON; fall back to a trimmed snippet for the client.
        failureMessage = rawBody.slice(0, 200) || failureMessage;
      }

      return NextResponse.json({ error: failureMessage }, { status: 500 });
    }

    let elavonData: Record<string, unknown>;
    try {
      elavonData = JSON.parse(rawBody);
    } catch {
      console.error(
        '[payments/start] Elavon returned a non-JSON success body:\n' + rawBody
      );
      return NextResponse.json(
        { error: 'Unexpected response from payment gateway.' },
        { status: 502 }
      );
    }

    const newGatewayId = typeof elavonData.id === 'string' ? elavonData.id : null;
    const checkoutUrl = getCheckoutUrl(elavonData);

    if (!newGatewayId || !checkoutUrl) {
      console.error('[payments/start] Elavon session response is missing id or url:', elavonData);
      return NextResponse.json(
        { error: 'Unexpected response from payment gateway.' },
        { status: 502 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. Store the new session id only if the link still points at the session
    //    we inspected (compare-and-swap). If a concurrent request stored its own
    //    session first, hand out that one instead so the link keeps a single
    //    active session.
    // -------------------------------------------------------------------------
    let swap = supabase
      .from('payment_links')
      .update({ gateway_payment_id: newGatewayId })
      .eq('id', linkData.id)
      .is('paid_at', null);

    swap = previousGatewayId
      ? swap.eq('gateway_payment_id', previousGatewayId)
      : swap.is('gateway_payment_id', null);

    const { data: swappedRows, error: updateError } = await swap.select('id');

    if (updateError) {
      console.error(
        `[payments/start] Failed to persist gateway_payment_id for link ${linkData.id}:`,
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to start payment. Please try again.' },
        { status: 500 }
      );
    }

    if (!swappedRows || swappedRows.length === 0) {
      console.warn(
        `[payments/start] Link ${linkData.id} changed while creating session ${newGatewayId}; ` +
          'using the session stored by the concurrent request.'
      );

      const { data: currentLink, error: rereadError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', linkData.id)
        .maybeSingle();

      if (rereadError || !currentLink) {
        console.error(`[payments/start] Failed to re-read link ${linkData.id}:`, rereadError);
        return NextResponse.json(
          { error: 'Unable to start payment. Please try again.' },
          { status: 409 }
        );
      }

      if (currentLink.status === 'paid' || currentLink.paid_at) {
        return NextResponse.json(
          { error: 'This payment link has already been settled and completed.' },
          { status: 400 }
        );
      }

      const concurrent = await checkExistingSession(
        supabase,
        currentLink as unknown as VerifiablePaymentLink
      );

      if (concurrent.kind === 'reuse') {
        return NextResponse.json({
          success: true,
          checkout_url: concurrent.checkoutUrl,
          payment_id: concurrent.paymentId,
          reused: true,
        });
      }

      return NextResponse.json(
        { error: 'Unable to start payment. Please try again.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      payment_id: newGatewayId,
    });
  } catch (err: unknown) {
    console.error('[payments/start] API Route Error:', err);
    const message =
      err instanceof ElavonApiError
        ? 'Unable to reach the payment gateway. Please try again.'
        : 'Failed to initialize payment';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
