import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get('token');

  if (!rawToken) {
    return NextResponse.json({ error: 'Payment token is required.' }, { status: 400 });
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
      }),
    });

    const elavonData = await elavonRes.json();

    if (!elavonRes.ok) {
      console.error('Elavon Error:', elavonData);
      return NextResponse.json(
        { error: elavonData.failures?.[0]?.description || 'Failed to create payment session.' },
        { status: 500 }
      );
    }

    // Save Elavon session ID in Supabase payment_links
    await supabase
      .from('payment_links')
      .update({ gateway_payment_id: elavonData.id })
      .eq('id', linkData.id);

    return NextResponse.json({
      success: true,
      checkout_url: elavonData.url || elavonData.href,
      payment_id: elavonData.id,
    });
  } catch (err: unknown) {
    console.error('API Route Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to initialize payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}