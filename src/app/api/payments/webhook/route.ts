import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type MockGatewayEvent = {
  id?: string;
  object?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      amount?: number;
      currency?: string;
      status?: string;
      description?: string;
      latest_charge?: string | null;
      customer?: string | null;
    };
  };
};

const TERMINAL_STATUSES = new Set([
  "confirmed",
  "failed",
  "cancelled",
  "refunded",
]);

export async function POST(request: Request) {
  try {
    const expectedSecret =
      process.env.PAYSAFE_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error(
        "PAYSAFE_WEBHOOK_SECRET is not configured."
      );

      return NextResponse.json(
        { error: "Webhook is not configured." },
        { status: 500 }
      );
    }

    const receivedSecret =
      request.headers.get("x-paysafe-webhook-secret");

    if (
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.text();

    let event: MockGatewayEvent;

    try {
      event = JSON.parse(body) as MockGatewayEvent;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const providerPayment =
      event.data?.object;

    if (!event.id || !event.type || !providerPayment?.id) {
      return NextResponse.json(
        { error: "Invalid payment event." },
        { status: 400 }
      );
    }

    const paymentIntentId =
      providerPayment.id;

    const eventType = event.type;

    let nextStatus:
      | "confirmed"
      | "failed"
      | "cancelled"
      | "processing"
      | null = null;

    switch (eventType) {
      case "payment_intent.succeeded":
        nextStatus = "confirmed";
        break;

      case "payment_intent.payment_failed":
        nextStatus = "failed";
        break;

      case "payment_intent.canceled":
        nextStatus = "cancelled";
        break;

      case "payment_intent.processing":
        nextStatus = "processing";
        break;

      default:
        return NextResponse.json(
          {
            received: true,
            ignored: true,
            eventType,
          },
          { status: 200 }
        );
    }

    const admin = createAdminClient();

    const { data: payment, error: lookupError } =
      await admin
        .from("payments")
        .select(
          "id, status, amount, currency, provider_transaction_id"
        )
        .eq(
          "provider_transaction_id",
          paymentIntentId
        )
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Webhook payment lookup failed:",
        lookupError.message
      );

      return NextResponse.json(
        { error: "Unable to locate payment." },
        { status: 500 }
      );
    }

    if (!payment) {
      console.error(
        "Webhook payment not found:",
        paymentIntentId
      );

      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    // Never allow a later non-terminal event to
    // move an already-final payment backwards.
    if (TERMINAL_STATUSES.has(payment.status)) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Payment already finalized.",
        },
        { status: 200 }
      );
    }

    // Verify the basic payment identity before
    // changing the PaySafe status.
    const providerAmount =
      Number(providerPayment.amount);

    const providerCurrency =
      providerPayment.currency?.toUpperCase();

    const paysafeAmount =
      Number(payment.amount);

    const paysafeCurrency =
      payment.currency?.toUpperCase();

    if (
      !Number.isFinite(providerAmount) ||
      providerAmount !== paysafeAmount ||
      providerCurrency !== paysafeCurrency
    ) {
      console.error(
        "Webhook payment mismatch:",
        {
          paymentId: payment.id,
          providerPaymentId: paymentIntentId,
          providerAmount,
          paysafeAmount,
          providerCurrency,
          paysafeCurrency,
        }
      );

      return NextResponse.json(
        { error: "Payment data mismatch." },
        { status: 400 }
      );
    }

    const { error: updateError } =
      await admin
        .from("payments")
        .update({
          status: nextStatus,
          provider_reference:
            providerPayment.latest_charge ||
            paymentIntentId,
          provider_transaction_id:
            paymentIntentId,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", payment.id)
        .not(
          "status",
          "in",
          "(confirmed,failed,cancelled,refunded)"
        );

    if (updateError) {
      console.error(
        "Webhook payment update failed:",
        updateError.message
      );

      return NextResponse.json(
        { error: "Unable to update payment." },
        { status: 500 }
      );
    }

    console.log(
      "Payment status updated from webhook:",
      {
        eventId: event.id,
        eventType,
        paymentId: payment.id,
        providerPaymentId: paymentIntentId,
        status: nextStatus,
      }
    );

    return NextResponse.json(
      {
        received: true,
        paymentId: payment.id,
        status: nextStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Payment webhook error:",
      error
    );

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}