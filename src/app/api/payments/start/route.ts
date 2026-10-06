import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createProviderPayment } from "@/lib/payments/providers";

type ProviderConfigurationRow = {
  payment_id: string;
  merchant_id: string;
  business_id: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  provider_code: string;
  api_base_url: string;
  api_key_encrypted: string | null;
  api_secret_encrypted: string;
  merchant_alias_encrypted: string | null;
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Payment link token is required." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Create the pending payment attempt.
    // ---------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase.rpc("create_payment_attempt", {
      p_link_token: token,
    });

    if (paymentError || !payment) {
      console.error(
        "Failed to create payment attempt:",
        paymentError?.message
      );

      return NextResponse.json(
        {
          error:
            paymentError?.message ||
            "Unable to create the payment attempt.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 2. Determine the merchant integration type.
    // ---------------------------------------------------------

    const admin = createAdminClient();

    const {
      data: providerConfiguration,
      error: configurationError,
    } = await admin.rpc("get_payment_provider_configuration", {
      p_payment_id: payment.id,
    });

    // If the merchant is not Payment API, try the existing
    // Hosted Payment Page flow.
    if (
      configurationError ||
      !providerConfiguration ||
      providerConfiguration.length === 0
    ) {
      const {
        data: redirectUrl,
        error: redirectError,
      } = await supabase.rpc("get_payment_redirect", {
        p_payment_id: payment.id,
      });

      if (redirectError || !redirectUrl) {
        console.error(
          "Failed to resolve payment redirect:",
          redirectError?.message
        );

        return NextResponse.json(
          {
            error:
              redirectError?.message ||
              configurationError?.message ||
              "Unable to resolve the payment destination.",
          },
          { status: 400 }
        );
      }

      return NextResponse.redirect(redirectUrl);
    }

    // ---------------------------------------------------------
    // 3. Payment API merchant.
    // ---------------------------------------------------------

    const configuration =
      providerConfiguration[0] as ProviderConfigurationRow;

    if (!configuration.api_secret_encrypted) {
      return NextResponse.json(
        {
          error:
            "Payment provider credentials are not configured.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Create payment with provider.
    // ---------------------------------------------------------

    let providerResult;

    try {
      providerResult = await createProviderPayment({
        paymentId: configuration.payment_id,
        merchantId: configuration.merchant_id,
        businessId: configuration.business_id,
        amount: Number(configuration.amount),
        currency: configuration.currency,
        customerName: configuration.customer_name,
        customerEmail: configuration.customer_email,
        providerCode: configuration.provider_code,
        apiBaseUrl: configuration.api_base_url,
        apiKeyEncrypted: configuration.api_key_encrypted,
        apiSecretEncrypted: configuration.api_secret_encrypted,
        merchantAliasEncrypted:
          configuration.merchant_alias_encrypted,
        returnUrl: `${request.nextUrl.origin}/api/payments/return?paymentId=${payment.id}`,
      });
    } catch (providerError) {
      console.error(
        "Payment provider request failed:",
        providerError
      );

      await admin
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      return NextResponse.json(
        {
          error:
            "Unable to initialize the payment with the payment provider.",
        },
        { status: 502 }
      );
    }

    // ---------------------------------------------------------
    // 5. Mark the PaySafe payment as processing.
    // ---------------------------------------------------------

    const { error: updateError } = await admin
      .from("payments")
      .update({
        status: "processing",
        provider_reference:
          providerResult.providerReference || null,
        provider_transaction_id:
          providerResult.providerTransactionId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error(
        "Failed to update payment after provider initialization:",
        updateError.message
      );

      return NextResponse.json(
        {
          error:
            "Payment was initialized but PaySafe could not update its status.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 6. Send customer to provider checkout.
    // ---------------------------------------------------------

    return NextResponse.redirect(providerResult.paymentUrl);
  } catch (error) {
    console.error("Payment start error:", error);

    return NextResponse.json(
      {
        error: "Unable to start payment.",
      },
      { status: 500 }
    );
  }
}