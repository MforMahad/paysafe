import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role Client to bypass RLS for server-to-server calls
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Elavon payload identifier and event type
    const eventId = payload.id || payload.eventId || `evt_${Date.now()}`;
    const eventType = payload.eventType || payload.type || 'transaction.succeeded';

    // 1. Idempotency Check: Prevent processing the same webhook twice
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // 2. Extract reference token or link ID from payload
    const referenceToken = payload.reference || payload.order?.reference || payload.merchantTransactionId;
    const gatewayPaymentId = payload.paymentLink || payload.ssl_txn_id;

    // 3. Process Successful Payment Event
    if (
      eventType === 'saleAuthorized' || 
      eventType === 'transaction.succeeded' ||
      payload.ssl_result === '0' // Converge success code
    ) {
      // Find matching payment link
      const { data: paymentLink } = await supabaseAdmin
        .from('payment_links')
        .select('*')
        .or(`link_token.eq.${referenceToken},gateway_payment_id.eq.${gatewayPaymentId}`)
        .maybeSingle();

      if (paymentLink) {
        // Update payment_links table to paid
        await supabaseAdmin
          .from('payment_links')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            gateway_payment_id: gatewayPaymentId || paymentLink.gateway_payment_id,
            payment_details: payload,
          })
          .eq('id', paymentLink.id);

        // Record entry in the payments table
        await supabaseAdmin
          .from('payments')
          .insert({
            business_id: paymentLink.business_id,
            payment_link_id: paymentLink.id,
            merchant_id: paymentLink.merchant_id,
            amount: paymentLink.amount,
            currency: paymentLink.currency,
            status: 'completed',
            customer_name: paymentLink.customer_name,
            customer_email: paymentLink.customer_email,
            provider_reference: referenceToken,
            provider_transaction_id: payload.ssl_txn_id || payload.id || gatewayPaymentId,
            idempotency_key: eventId,
          });
      }
    }

    // 4. Log raw payload into webhook_events audit ledger
    await supabaseAdmin.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'elavon',
      payload,
      processed: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Elavon Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}