import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicPaymentLinkRow = {
  id: string;
  description: string | null;
  amount: number;
  currency: string;
  customer_name: string | null;
  customer_email?: string | null;
  status: "active" | "expired" | "cancelled";
};

type PaymentRow = {
  id: string;
  payment_link_id: string;
  provider_reference: string | null;
  provider_transaction_id: string | null;
  status: string;
};

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams
    .get("paymentId")
    ?.trim();

  const token = request.nextUrl.searchParams
    .get("token")
    ?.trim();

  if (!paymentId || !token) {
    return NextResponse.json(
      {
        error:
          "Payment ID and payment link token are required.",
      },
      { status: 400 }
    );
  }

  try {
    /*
     * ---------------------------------------------------------
     * 1. Resolve the public payment link from the token.
     *
     * This is the same RPC already proven to work on the
     * public payment page.
     * ---------------------------------------------------------
     */

    const supabase = await createClient();

    const {
      data: publicLinkData,
      error: publicLinkError,
    } = await supabase.rpc(
      "get_public_payment_link",
      {
        p_link_token: token,
      }
    );

    if (publicLinkError) {
      console.error(
        "Payment session public-link RPC failed:",
        publicLinkError
      );

      return NextResponse.json(
        {
          error:
            "Unable to resolve the payment session.",
        },
        { status: 500 }
      );
    }

    const publicLink =
      Array.isArray(publicLinkData)
        ? (publicLinkData[0] as
            | PublicPaymentLinkRow
            | undefined)
        : (publicLinkData as
            | PublicPaymentLinkRow
            | null);

    if (!publicLink) {
      return NextResponse.json(
        {
          error: "Payment link not found.",
        },
        { status: 404 }
      );
    }

    if (publicLink.status !== "active") {
      return NextResponse.json(
        {
          error:
            "This payment link is no longer active.",
        },
        { status: 409 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Resolve the exact PaySafe payment.
     *
     * Service role is server-only and is never returned.
     * ---------------------------------------------------------
     */

    const admin = createAdminClient();

    const {
      data: payment,
      error: paymentError,
    } = await admin
      .from("payments")
      .select(
        `
          id,
          payment_link_id,
          provider_reference,
          provider_transaction_id,
          status
        `
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError) {
      console.error(
        "Payment session payment lookup failed:",
        paymentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to resolve the payment session.",
        },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        {
          error: "Payment not found.",
        },
        { status: 404 }
      );
    }

    const paymentRow = payment as PaymentRow;

    /*
     * ---------------------------------------------------------
     * 3. SECURITY CHECK
     *
     * The payment ID in the URL MUST belong to the payment
     * link represented by the public token.
     * ---------------------------------------------------------
     */

    if (
      paymentRow.payment_link_id !==
      publicLink.id
    ) {
      console.error(
        "Payment/session ownership mismatch:",
        {
          paymentId,
          paymentLinkFromPayment:
            paymentRow.payment_link_id,
          paymentLinkFromToken:
            publicLink.id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment does not belong to this payment link.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Verify payment is still usable.
     * ---------------------------------------------------------
     */

    if (
      paymentRow.status !== "pending" &&
      paymentRow.status !== "processing"
    ) {
      return NextResponse.json(
        {
          error:
            "This payment is no longer available.",
        },
        { status: 409 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. provider_reference contains the Elavon PaymentSession
     * ID created by createElavonPayment().
     * ---------------------------------------------------------
     */

    if (!paymentRow.provider_reference) {
      console.error(
        "Payment has no provider session:",
        paymentId
      );

      return NextResponse.json(
        {
          error:
            "The payment provider session has not been initialized.",
        },
        { status: 409 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Return ONLY browser-safe information.
     *
     * Never return:
     * - API secret
     * - merchant alias
     * - encrypted credentials
     * - Supabase service-role key
     * - merchant configuration
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      paymentId: paymentRow.id,
      providerSessionId:
        paymentRow.provider_reference,
    });
  } catch (error) {
    console.error(
      "Payment session endpoint unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the payment session.",
      },
      { status: 500 }
    );
  }
}