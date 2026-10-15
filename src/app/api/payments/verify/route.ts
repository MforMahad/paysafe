import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  collectMissingEnvIssues,
  extractGatewayId,
  isSettledStatus,
  verifyAndSettlePaymentLink,
  type VerifiablePaymentLink,
} from '@/lib/payment-verification';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const gatewayIdCandidates = [
    extractGatewayId(url.searchParams.get('paymentLink')),
    extractGatewayId(url.searchParams.get('sessionId')),
  ].filter((value): value is string => Boolean(value));

  if (!token && gatewayIdCandidates.length === 0) {
    return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // 0. Environment sanity check (critical for Netlify serverless functions).
  // ---------------------------------------------------------------------------
  const missingEnv = collectMissingEnvIssues();
  if (missingEnv.length > 0) {
    missingEnv.forEach((issue) => console.error(`[payments/verify] ${issue}`));
    return NextResponse.json(
      { error: 'Server misconfiguration. Please contact support.' },
      { status: 500 }
    );
  }

  // Service-role client with no cookies, so writes are never downgraded to a
  // logged-in user's RLS context.
  const supabase = createAdminClient();

  // 1. Fetch the payment link: by public token first, then by Elavon session id.
  //    Separate .eq() lookups (rather than an interpolated .or() filter) keep
  //    user-supplied values from altering the PostgREST filter.
  const lookups: Array<[column: string, value: string]> = [
    ...(token ? [['link_token', token] as [string, string], ['gateway_payment_id', token] as [string, string]] : []),
    ...gatewayIdCandidates.map((id) => ['gateway_payment_id', id] as [string, string]),
  ];

  let linkData: Record<string, unknown> | null = null;

  for (const [column, value] of lookups) {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq(column, value)
      .maybeSingle();

    if (error) {
      console.error(`[payments/verify] Lookup failed (${column}=${value}):`, error);
      continue;
    }

    if (data) {
      linkData = data;
      break;
    }
  }

  if (!linkData) {
    console.error('[payments/verify] Payment link not found for', { token, gatewayIdCandidates });
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }

  // Idempotency: If link is already marked paid with record existing, return early
  if (linkData.status === 'paid' && linkData.paid_at) {
    return NextResponse.json({ status: 'paid', alreadyPaid: true });
  }

  if (!linkData.gateway_payment_id) {
    return NextResponse.json({ status: 'pending', message: 'No gateway session associated' });
  }

  // 2. Query Elavon and update both tables when settled (case-insensitive).
  const link = linkData as unknown as VerifiablePaymentLink;
  const outcome = await verifyAndSettlePaymentLink(supabase, link);

  if (outcome.isPaid && !outcome.updated) {
    // The customer has been charged but we could not record it. Do not report
    // success: the start route relies on payment_links.status to block a
    // second payment on this single-use link.
    console.error(
      `[payments/verify] Link ${link.link_token} settled at gateway (status: ${outcome.gatewayStatus}) ` +
        'but payment_links could not be updated. See preceding [verify] errors.'
    );
    return NextResponse.json(
      { status: 'unrecorded', error: 'Payment received but could not be recorded.' },
      { status: 500 }
    );
  }

  if (outcome.error && !outcome.isPaid) {
    console.error(`[payments/verify] Gateway verification error: ${outcome.error}`);
    return NextResponse.json(
      { error: 'Failed to verify payment with gateway' },
      { status: 500 }
    );
  }

  if (outcome.isPaid) {
    console.log(
      `[payments/verify] Link ${link.link_token} settled (gateway status: ${outcome.gatewayStatus}). ` +
        `payment_links status='paid' and paid_at persisted.`
    );
    return NextResponse.json({ status: 'paid', updated: true });
  }

  // Not yet settled — report the current known status.
  const currentStatus = isSettledStatus(linkData.status)
    ? 'paid'
    : (linkData.status as string | undefined) || 'pending';

  return NextResponse.json({ status: currentStatus, gatewayStatus: outcome.gatewayStatus });
}
