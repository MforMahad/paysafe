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

/** Base URL for the Elavon Payment Gateway API (sandbox environment). */
export const ELAVON_API_BASE_URL = 'https://api.sandbox.elavonpayments.com';

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

/** Normalise a raw gateway status into a boolean "settled" flag. */
export function isSettledStatus(rawStatus: unknown): boolean {
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  return status === 'paid' || status === 'completed';
}

/**
 * Fetch the current state of a payment link directly from Elavon.
 * Throws on network failure or a non-2xx response so callers can log it.
 */
export async function fetchElavonPaymentLink(
  gatewayPaymentId: string
): Promise<Record<string, unknown>> {
  let response: Response;

  try {
    response = await fetch(
      `${ELAVON_API_BASE_URL}/payment-links/${encodeURIComponent(gatewayPaymentId)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Version': '1',
          Authorization: getElavonAuthHeader(),
        },
        // Never cache gateway lookups — status can change at any moment.
        cache: 'no-store',
      }
    );
  } catch (networkErr: unknown) {
    const message =
      networkErr instanceof Error ? networkErr.message : String(networkErr);
    console.error('[verify] Elavon fetch threw a network error:', networkErr);
    throw new Error(`Elavon request failed: ${message}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch (parseErr: unknown) {
    console.error('[verify] Failed to parse Elavon response JSON:', parseErr);
    throw new Error('Elavon returned a non-JSON response.');
  }

  if (!response.ok) {
    console.error(
      `[verify] Elavon API responded with HTTP ${response.status}:`,
      data
    );
    throw new Error(`Elavon API responded with status ${response.status}.`);
  }

  return data;
}

/**
 * Persist a settled payment. Updates the `payment_links` row to `paid` and
 * inserts a corresponding row into `payments` (idempotently).
 */
export async function markPaymentLinkAsPaid(
  supabase: SupabaseClient,
  link: VerifiablePaymentLink,
  elavonData: Record<string, unknown>
): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // 1. Update the payment_links row.
  const { error: updateError } = await supabase
    .from('payment_links')
    .update({
      status: 'paid',
      paid_at: timestamp,
      payment_details: elavonData ?? {},
    })
    .eq('id', link.id);

  if (updateError) {
    console.error('[verify] Failed to update payment_links:', updateError);
    return false;
  }

  // 2. Insert a payments row only if one does not already exist.
  const { data: existingPayment, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('payment_link_id', link.id)
    .maybeSingle();

  if (existingError) {
    console.error('[verify] Error checking existing payments:', existingError);
  }

  if (!existingPayment) {
    const transactionId =
      (typeof elavonData.transactionId === 'string' && elavonData.transactionId) ||
      (typeof elavonData.id === 'string' && elavonData.id) ||
      link.gateway_payment_id ||
      null;

    const { error: insertError } = await supabase.from('payments').insert({
      business_id: link.business_id ?? null,
      payment_link_id: link.id,
      merchant_id: link.merchant_id ?? null,
      amount: link.amount,
      currency: (link.currency || 'USD').toUpperCase(),
      status: 'confirmed',
      customer_name: link.customer_name ?? null,
      customer_email: link.customer_email ?? null,
      provider_reference: link.link_token,
      provider_transaction_id: transactionId,
    });

    if (insertError) {
      console.error('[verify] Failed to insert into payments:', insertError);
      // The link is already marked paid, so treat this as a soft failure.
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
    return { isPaid: true, gatewayStatus, updated };
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

