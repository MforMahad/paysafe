import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  collectMissingEnvIssues,
  isSettledStatus,
  verifyAndSettlePaymentLink,
  type VerifiablePaymentLink,
} from '@/lib/payment-verification';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
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

  // 1. Fetch payment link record matching either link_token or gateway_payment_id
  const { data: linkData, error: linkError } = await supabase
    .from('payment_links')
    .select('*')
    .or(`link_token.eq.${token},gateway_payment_id.eq.${token}`)
    .maybeSingle();

  if (linkError || !linkData) {
    console.error('[payments/verify] Database lookup failed or link not found:', linkError);
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
        `payment_links + payments updated.`
    );
    return NextResponse.json({ status: 'paid', updated: outcome.updated });
  }

  // Not yet settled — report the current known status.
  const currentStatus = isSettledStatus(linkData.status)
    ? 'paid'
    : linkData.status || 'pending';

  return NextResponse.json({ status: currentStatus, gatewayStatus: outcome.gatewayStatus });
}
