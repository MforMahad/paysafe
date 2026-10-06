import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ElavonNotification = {
  eventType?: string;
  customReference?: string | null;
  transaction?: string | null;
  shopperEmailAddress?: string | null;
  payloadId?: string | null;
};

const CONFIRMED_EVENTS = new Set([
  "saleAuthorized",
  "saleCaptured",
  "saleSettled",
]);

const PROCESSING_EVENTS = new Set([
  "saleHeldForReview",
]);

const FAILED_EVENTS = new Set([
  "saleDeclined",
]);

const REFUNDED_EVENTS = new Set([
  "refundAuthorized",
  "refundCaptured",
  "refundSettled",
]);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!rawBody.trim()) {
      return NextResponse.json(
        { error: "Empty notification body." },
        { status: 400 }
      );
    }

    let notification: ElavonNotification;

    try {
      notification = JSON.parse(
        rawBody
      ) as ElavonNotification;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON notification." },
        { status: 400 }
      );
    }

    const eventType = notification.eventType?.trim();
    const paymentId =
      notification.customReference?.trim();

    if (!eventType) {
      console.error(
        "Elavon webhook missing eventType:",
        notification
      );

      return NextResponse.json(
        { error: "eventType is required." },
        { status: 400 }
      );
    }

    if (!paymentId) {
      console.error(
        "Elavon webhook missing customReference:",
        {
          eventType,
          payloadId: notification.payloadId,
        }
      );

      return NextResponse.json(
        { error: "customReference is required." },
        { status: 400 }
      );
    }

    let nextStatus:
      | "confirmed"
      | "processing"
      | "failed"
      | "refunded"
      | null = null;

    if (CONFIRMED_EVENTS.has(eventType)) {
      nextStatus = "confirmed";
    } else if (PROCESSING_EVENTS.has(eventType)) {
      nextStatus = "processing";
    } else if (FAILED_EVENTS.has(eventType)) {
      nextStatus = "failed";
    } else if (REFUNDED_EVENTS.has(eventType)) {
      nextStatus = "refunded";
    }

    /*
     * Some Elavon events do not represent a final PaySafe
     * payment status. Acknowledge them without changing the
     * payment.
     */
    if (!nextStatus) {
      console.info(
        "Ignoring unsupported Elavon event:",
        eventType
      );

      return NextResponse.json({
        received: true,
        ignored: true,
        eventType,
      });
    }

    const admin = createAdminClient();

    const update: {
      status: typeof nextStatus;
      provider_transaction_id?: string | null;
      provider_reference?: string | null;
      updated_at: string;
    } = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (notification.transaction) {
      const transactionUrl =
        notification.transaction.trim();

      const transactionId =
        transactionUrl.split("/").filter(Boolean).pop() ||
        null;

      if (transactionId) {
        update.provider_transaction_id =
          transactionId;
      }
    }

    if (notification.payloadId) {
      update.provider_reference =
        notification.payloadId.trim();
    }

    const { data: payment, error: paymentError } =
      await admin
        .from("payments")
        .update(update)
        .eq("id", paymentId)
        .select("id, status")
        .maybeSingle();

    if (paymentError) {
      console.error(
        "Failed to update PaySafe payment from Elavon webhook:",
        paymentError.message
      );

      return NextResponse.json(
        { error: "Unable to update payment." },
        { status: 500 }
      );
    }

    if (!payment) {
      console.error(
        "PaySafe payment not found for Elavon notification:",
        {
          paymentId,
          eventType,
          payloadId: notification.payloadId,
        }
      );

      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      received: true,
      paymentId: payment.id,
      status: payment.status,
      eventType,
    });
  } catch (error) {
    console.error(
      "Elavon webhook error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to process Elavon notification." },
      { status: 500 }
    );
  }
}