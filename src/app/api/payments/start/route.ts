import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function GET(request: Request) {
  // ---------------------------------------------------------------------------
  // 0. Environment sanity check.
  //    Netlify serverless functions fail silently when an env var is missing
  //    from the site configuration, so we surface that explicitly in logs.
  // ---------------------------------------------------------------------------
  const missingEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ELAVON_MERCHANT_ALIAS',
    'ELAVON_SECRET_KEY',
  ].filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    console.error(
      `[payments/start] Missing environment variables: ${missingEnv.join(', ')}`
    );
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: linkData, error: linkError } = await supabase
    .from('payment_links')
    .select('*')
    .eq('link_token', rawToken)
    .maybeSingle();

  if (linkError || !linkData) {
    console.error('Supabase lookup error:', linkError);
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

  const credentials = Buffer.from(
    `${process.env.ELAVON_MERCHANT_ALIAS}:${process.env.ELAVON_SECRET_KEY}`
  ).toString('base64');

  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const elavonRes = await fetch('https://api.sandbox.elavonpayments.com/payment-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Version': '1',
        'Authorization': `Basic ${credentials}`,
      },
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

    let elavonData: {
      id?: string;
      url?: string;
      href?: string;
      orderReference?: string;
    };
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

    // Save Elavon session ID in Supabase payment_links
    const { error: updateError } = await supabase
      .from('payment_links')
      .update({ gateway_payment_id: elavonData.id })
      .eq('id', linkData.id);

    if (updateError) {
      console.error('[payments/start] Failed to persist gateway_payment_id:', updateError);
    }

    return NextResponse.json({
      success: true,
      checkout_url: elavonData.url || elavonData.href,
      payment_id: elavonData.id,
    });
  } catch (err: unknown) {
    console.error('[payments/start] API Route Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to initialize payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}