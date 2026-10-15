/**
 * Shared Elavon payment-verification utilities.
 *
 * This module centralises the logic used to:
 *  1. Query the Elavon Payment Gateway API for the current status of a
 *     hosted payment link.
 *  2. Normalise the gateway status (case-insensitive) into a boolean.
 *  3. Persist a "paid" outcome to both the `payment_links` and `payments`
 *     tables in Supabase.
 *
 * It is imported by both the `/api/payments/verify` route and the public
 * `/pay/[token]` checkout page so that status is reconciled on the fly
 * regardless of whether the customer lands on the return page.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** Sandbox API host, used only outside production when ELAVON_API_BASE_URL is unset. */
const ELAVON_SANDBOX_API_BASE_URL = 'https://api.sandbox.elavonpayments.com';

/** Upper bound for any single Elavon API call, well inside serverless limits. */
export const ELAVON_REQUEST_TIMEOUT_MS = 8000;

/** Error raised for failed Elavon API calls; `status` is set for HTTP errors. */
export class ElavonApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'ElavonApiError';
  }
}

/**
 * Elavon API base URL from ELAVON_API_BASE_URL. Production must set it
 * explicitly so a deploy can never silently talk to the sandbox (or vice versa).
 */
export function getElavonApiBaseUrl(): string {
  const configured = process.env.ELAVON_API_BASE_URL?.trim().replace(/\/+$/, '');

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new ElavonApiError('ELAVON_API_BASE_URL is not configured.');
  }

  return ELAVON_SANDBOX_API_BASE_URL;
}

/** Shape of the relevant fields we read off a `payment_links` row. */
export interface VerifiablePaymentLink {
  id: string;
  amount: number | string;
  currency?: string | null;
  business_id?: string | null;
  merchant_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  link_token: string;
  gateway_payment_id?: string | null;
  status?: string | null;
}

/** Result of an on-the-fly verification attempt. */
export interface VerificationOutcome {
  /** True when the gateway reports the transaction as settled. */
  isPaid: boolean;
  /** Lower-cased gateway status string (for debugging/logging). */
  gatewayStatus: string;
  /** True when we actually performed a write to the database. */
  updated: boolean;
  /** Populated when the gateway request itself failed (network/HTTP). */
  error?: string;
}

/**
 * Validate that every environment variable required for gateway + database
 * operations is present. Returns a list of human-readable problem strings
 * (empty array when everything is configured).
 *
 * Detailed logging here is critical because Netlify serverless functions fail
 * silently when an env var is missing from the site configuration.
 */
export function collectMissingEnvIssues(): string[] {
  const required: Array<[string, string | undefined]> = [
    ['ELAVON_MERCHANT_ALIAS', process.env.ELAVON_MERCHANT_ALIAS],
    ['ELAVON_SECRET_KEY', process.env.ELAVON_SECRET_KEY],
    ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
  ];

  if (process.env.NODE_ENV === 'production') {
    required.push(['ELAVON_API_BASE_URL', process.env.ELAVON_API_BASE_URL]);
  }

  return required
    .filter(([, value]) => !value)
    .map(([name]) => `Missing environment variable: ${name}`);
}

/** Build the Basic-auth header value for the Elavon API. */
export function getElavonAuthHeader(): string {
  const alias = process.env.ELAVON_MERCHANT_ALIAS;
  const secret = process.env.ELAVON_SECRET_KEY;

  if (!alias || !secret) {
    throw new Error(
      'Elavon credentials are not configured (ELAVON_MERCHANT_ALIAS / ELAVON_SECRET_KEY).'
    );
  }

  const credentials = Buffer.from(`${alias}:${secret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Elavon refers to a payment link either by bare id or by full resource href
 * (return-URL params, notification payloads). Reduce either form to the bare
 * id stored in `payment_links.gateway_payment_id`.
 */
export function extractGatewayId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const segments = new URL(trimmed).pathname.split('/').filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return trimmed;
  }
}

/** Normalise a raw gateway status into a boolean "settled" flag. */
export function isSettledStatus(rawStatus: unknown): boolean {
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  return status === 'paid' || status === 'completed';
}

/**
 * Single entry point for Elavon API calls: applies the configured base URL,
 * Basic auth, API version header, no-store caching and an 8s timeout.
 * Network failures and timeouts are rethrown as ElavonApiError (no status).
 */
export async function elavonFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Accept-Version', '1');
  headers.set('Authorization', getElavonAuthHeader());

  try {
    return await fetch(`${getElavonApiBaseUrl()}${path}`, {
      ...init,
      headers,
      // Never cache gateway calls — status can change at any moment.
      cache: 'no-store',
      signal: AbortSignal.timeout(ELAVON_REQUEST_TIMEOUT_MS),
    });
  } catch (networkErr: unknown) {
    if (networkErr instanceof ElavonApiError) {
      throw networkErr;
    }

    const timedOut = networkErr instanceof Error && networkErr.name === 'TimeoutError';
    const message = timedOut
      ? `timed out after ${ELAVON_REQUEST_TIMEOUT_MS}ms`
      : networkErr instanceof Error
        ? networkErr.message
        : String(networkErr);

    console.error(`[elavon] ${init.method ?? 'GET'} ${path} failed: ${message}`, networkErr);
    throw new ElavonApiError(`Elavon request failed: ${message}`);
  }
}

/**
 * Fetch the current state of a payment link directly from Elavon.
 * Throws ElavonApiError on network failure, timeout, non-JSON body or a
 * non-2xx response (with `status` set) so callers can branch on it.
 */
export async function fetchElavonPaymentLink(
  gatewayPaymentId: string
): Promise<Record<string, unknown>> {
  const response = await elavonFetch(`/payment-links/${encodeURIComponent(gatewayPaymentId)}`);
  const rawBody = await response.text();

  let data: unknown = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    // Handled below: error bodies may legitimately be HTML/plain text.
  }

  if (!response.ok) {
    console.error(
      `[elavon] GET /payment-links/${gatewayPaymentId} responded with HTTP ${response.status}:`,
      data ?? rawBody.slice(0, 500)
    );
    throw new ElavonApiError(
      `Elavon API responded with status ${response.status}.`,
      response.status,
      data ?? rawBody
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('[elavon] Expected a JSON object from Elavon, got:', rawBody.slice(0, 500));
    throw new ElavonApiError('Elavon returned a non-JSON response.', response.status);
  }

  return data as Record<string, unknown>;
}

/**
 * Persist a settled payment. Updates the `payment_links` row to `paid` and
 * inserts a corresponding row into `payments`.
 *
 * Concurrency-safe: the return page, the webhook and /pay/[token] can all
 * verify the same payment at once. The UPDATE only applies while
 * `paid_at IS NULL`, so exactly one caller performs the transition (keeping
 * the original paid_at) and only that caller writes the `payments` row.
 *
 * Returns true when the row is confirmed as `status = 'paid'` with a
 * `paid_at` timestamp, whether this call or a concurrent one recorded it.
 * `supabase` must be a service-role client (see `createAdminClient`): under
 * RLS an UPDATE that matches no permitted rows succeeds with zero rows.
 */
export async function markPaymentLinkAsPaid(
  supabase: SupabaseClient,
  link: VerifiablePaymentLink,
  elavonData: Record<string, unknown>
): Promise<boolean> {
  // 1. Transition payment_links to paid, only if nobody has recorded it yet.
  const { data: updatedRows, error: updateError } = await supabase
    .from('payment_links')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_details: elavonData ?? {},
    })
    .eq('id', link.id)
    .is('paid_at', null)
    .select('*');

  if (updateError) {
    console.error(`[verify] Failed to update payment_links for link ${link.id}:`, updateError);
    return false;
  }

  const updatedRow = updatedRows?.[0] as (VerifiablePaymentLink & { paid_at?: string | null }) | undefined;

  if (!updatedRow) {
    // Zero rows: either a concurrent caller already recorded the payment, or
    // the write was blocked. Re-read to tell the two apart.
    const { data: currentRow, error: readError } = await supabase
      .from('payment_links')
      .select('id, status, paid_at')
      .eq('id', link.id)
      .maybeSingle();

    if (readError) {
      console.error(`[verify] Failed to re-read payment_links for link ${link.id}:`, readError);
      return false;
    }

    if (currentRow?.status === 'paid' && currentRow.paid_at) {
      console.log(`[verify] Link ${link.id} was already recorded as paid by a concurrent request.`);
      return true;
    }

    console.error(
      `[verify] UPDATE payment_links matched 0 rows for link ${link.id} (current row: ` +
        `${JSON.stringify(currentRow)}). Check that the client uses SUPABASE_SERVICE_ROLE_KEY ` +
        'without a user session, and that paid_at is not set on an unpaid link.'
    );
    return false;
  }

  if (updatedRow.status !== 'paid' || !updatedRow.paid_at) {
    console.error(`[verify] UPDATE payment_links did not persist status/paid_at for link ${link.id}:`, updatedRow);
    return false;
  }

  // 2. Record the payment. Fields come from the freshly updated row, so callers
  //    that pass a partial link (e.g. /pay/[token]) still write complete data.
  const { data: existingPayment, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('payment_link_id', link.id)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error(`[verify] Error checking existing payments for link ${link.id}:`, existingError);
  }

  if (!existingPayment) {
    const transactionId =
      (typeof elavonData.transactionId === 'string' && elavonData.transactionId) ||
      (typeof elavonData.id === 'string' && elavonData.id) ||
      updatedRow.gateway_payment_id ||
      null;

    const { error: insertError } = await supabase.from('payments').insert({
      business_id: updatedRow.business_id ?? null,
      payment_link_id: updatedRow.id,
      merchant_id: updatedRow.merchant_id ?? null,
      amount: updatedRow.amount,
      currency: (updatedRow.currency || 'USD').toUpperCase(),
      status: 'confirmed',
      customer_name: updatedRow.customer_name ?? null,
      customer_email: updatedRow.customer_email ?? null,
      provider_reference: updatedRow.link_token,
      provider_transaction_id: transactionId,
    });

    if (insertError?.code === '23505') {
      // Unique violation: a payments row for this link already exists.
      console.warn(`[verify] payments row for link ${link.id} already exists; skipping insert.`);
    } else if (insertError) {
      // The link is already marked paid, so treat this as a soft failure.
      console.error(`[verify] Failed to insert into payments for link ${link.id}:`, insertError);
    }
  }

  return true;
}

/**
 * High-level helper: given a payment link that already has a
 * `gateway_payment_id`, check Elavon and, if settled, update the database.
 * Never throws — returns an outcome object the caller can act on.
 */
export async function verifyAndSettlePaymentLink(
  supabase: SupabaseClient,
  link: VerifiablePaymentLink
): Promise<VerificationOutcome> {
  if (!link.gateway_payment_id) {
    return {
      isPaid: false,
      gatewayStatus: link.status?.toLowerCase() ?? '',
      updated: false,
      error: 'No gateway session associated with this link.',
    };
  }

  try {
    const elavonData = await fetchElavonPaymentLink(link.gateway_payment_id);
    const gatewayStatus =
      typeof elavonData.status === 'string'
        ? elavonData.status.toLowerCase()
        : '';

    if (!isSettledStatus(gatewayStatus)) {
      return { isPaid: false, gatewayStatus, updated: false };
    }

    const updated = await markPaymentLinkAsPaid(supabase, link, elavonData);
    return {
      isPaid: true,
      gatewayStatus,
      updated,
      ...(updated ? {} : { error: 'Payment settled at gateway but database update failed.' }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[verify] verifyAndSettlePaymentLink failed:', message);
    return {
      isPaid: false,
      gatewayStatus: '',
      updated: false,
      error: message,
    };
  }
}

