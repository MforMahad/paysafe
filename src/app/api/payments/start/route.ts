import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Payment link token is required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 1. Create a pending payment attempt from the trusted payment link.
  const { data: payment, error: paymentError } = await supabase.rpc(
    "create_payment_attempt",
    {
      p_link_token: token,
    }
  );

  if (paymentError || !payment) {
    console.error("Failed to create payment attempt:", paymentError);

    return NextResponse.json(
      {
        error:
          paymentError?.message ||
          "Unable to create the payment attempt.",
      },
      { status: 400 }
    );
  }

  // 2. Resolve the merchant destination from the payment record.
  const { data: redirectUrl, error: redirectError } = await supabase.rpc(
    "get_payment_redirect",
    {
      p_payment_id: payment.id,
    }
  );

  if (redirectError || !redirectUrl) {
    console.error("Failed to resolve payment redirect:", redirectError);

    return NextResponse.json(
      {
        error:
          redirectError?.message ||
          "Unable to resolve the payment destination.",
      },
      { status: 400 }
    );
  }

  // 3. Redirect the customer to the configured merchant gateway.
  return NextResponse.redirect(redirectUrl);
}