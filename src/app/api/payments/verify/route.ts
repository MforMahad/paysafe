import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
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
    console.error('Database lookup failed or link not found:', linkError);
    return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
  }

  // Idempotency: If link is already marked paid with record existing, return early
  if (linkData.status === 'paid' && linkData.paid_at) {
    return NextResponse.json({ status: 'paid', alreadyPaid: true });
  }

  if (!linkData.gateway_payment_id) {
    return NextResponse.json({ status: 'pending', message: 'No gateway session associated' });
  }

  // 2. Query Elavon Sandbox API directly
  const credentials = Buffer.from(
    `${process.env.ELAVON_MERCHANT_ALIAS}:${process.env.ELAVON_SECRET_KEY}`
  ).toString('base64');

  try {
    const elavonRes = await fetch(
      `https://api.sandbox.elavonpayments.com/payment-links/${linkData.gateway_payment_id}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Version': '1',
          'Authorization': `Basic ${credentials}`,
        },
      }
    );

    const elavonData = await elavonRes.json();

    if (!elavonRes.ok) {
      console.error('Elavon API Error:', elavonData);
      return NextResponse.json({ error: 'Failed to verify payment with gateway' }, { status: 500 });
    }

    // 3. Normalize status string for case-insensitive evaluation
    const elavonStatus = (elavonData.status || '').toLowerCase();
    const isPaid = elavonStatus === 'paid' || elavonStatus === 'completed';

    if (isPaid) {
      const timestamp = new Date().toISOString();

      // Update payment_links table status to 'paid'
      const { error: updateError } = await supabase
        .from('payment_links')
        .update({
          status: 'paid',
          paid_at: timestamp,
          payment_details: elavonData || {},
        })
        .eq('id', linkData.id);

      if (updateError) {
        console.error('Failed to update payment_links table:', updateError);
      }

      // Check if a payment record already exists before inserting
      const { data: existingPayment, error: existingError } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_link_id', linkData.id)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing payments:', existingError);
      }

      if (!existingPayment) {
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            business_id: linkData.business_id ?? null,
            payment_link_id: linkData.id,
            merchant_id: linkData.merchant_id ?? null,
            amount: linkData.amount,
            currency: linkData.currency || 'USD',
            status: 'confirmed',
            customer_name: linkData.customer_name ?? null,
            customer_email: linkData.customer_email ?? null,
            provider_reference: linkData.link_token,
            provider_transaction_id: elavonData.transactionId || linkData.gateway_payment_id,
          });

        if (insertError) {
          console.error('Failed to insert record into payments table:', insertError);
        }
      }

      return NextResponse.json({ status: 'paid', updated: true });
    }

    return NextResponse.json({ status: linkData.status || 'pending' });
  } catch (err: unknown) {
    console.error('Verification handler error:', err);
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}