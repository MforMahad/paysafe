import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams
    .get("paymentId")
    ?.trim();

  if (!paymentId) {
    return NextResponse.json(
      { error: "Payment ID is required." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: payment, error } = await admin
      .from("payments")
      .select("id, status")
      .eq("id", paymentId)
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to load returned payment:",
        error.message
      );

      return NextResponse.json(
        { error: "Unable to load payment." },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    const resultUrl = new URL(
      `/pay/result/${payment.id}`,
      request.nextUrl.origin
    );

    return NextResponse.redirect(resultUrl);
  } catch (error) {
    console.error("Payment return error:", error);

    return NextResponse.json(
      { error: "Unable to process payment return." },
      { status: 500 }
    );
  }
}