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

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  const idempotencyKey = request.headers
    .get("Idempotency-Key")
    ?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Payment link token is required." },
      { status: 400 }
    );
  }

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key header is required." },
      { status: 400 }
    );
  }

  if (idempotencyKey.length > 128) {
    return NextResponse.json(
      { error: "Idempotency-Key header is too long." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. Create or reuse the payment attempt.
    // ---------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase.rpc("create_payment_attempt", {
      p_link_token: token,
      p_idempotency_key: idempotencyKey,
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
    // 2. Load the payment provider configuration.
    // ---------------------------------------------------------

    const admin = createAdminClient();

    const {
      data: providerConfiguration,
      error: configurationError,
    } = await admin.rpc("get_payment_provider_configuration", {
      p_payment_id: payment.id,
    });

    // Do NOT silently fall back when the configuration RPC fails.
    if (configurationError) {
      console.error(
        "Provider configuration RPC failed:",
        {
          message: configurationError.message,
          code: configurationError.code,
          details: configurationError.details,
          hint: configurationError.hint,
          paymentId: payment.id,
        }
      );

      return NextResponse.json(
        {
          error: "Provider configuration RPC failed.",
          details: configurationError.message,
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 3. No Payment API configuration.
    //
    // Preserve the existing hosted-page merchant behavior.
    // ---------------------------------------------------------

    if (
      !providerConfiguration ||
      providerConfiguration.length === 0
    ) {
      console.error(
        "Provider configuration RPC returned no rows:",
        {
          paymentId: payment.id,
        }
      );

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
              "Unable to resolve the payment destination.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        paymentUrl: redirectUrl,
      });
    }

    // ---------------------------------------------------------
    // 4. Payment API merchant.
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
    // 5. Create the payment with the provider.
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
        apiSecretEncrypted:
          configuration.api_secret_encrypted,
        merchantAliasEncrypted:
          configuration.merchant_alias_encrypted,
        returnUrl:
          `${request.nextUrl.origin}/api/payments/return?paymentId=${payment.id}`,
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
    // 6. Require a provider session for Payment API providers.
    // ---------------------------------------------------------

    if (
      configuration.provider_code.trim().toLowerCase() ===
        "elavon_epg" &&
      !providerResult.providerSessionId
    ) {
      console.error(
        "Elavon payment session was not returned:",
        {
          paymentId: payment.id,
        }
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
            "The payment provider did not return a payment session.",
        },
        { status: 502 }
      );
    }

    // ---------------------------------------------------------
    // 7. Mark the PaySafe payment as processing.
    //
    // provider_reference stores the Elavon Payment Session ID
    // until we receive the actual provider transaction ID.
    // ---------------------------------------------------------

    const { error: updateError } = await admin
      .from("payments")
      .update({
        status: "processing",
        provider_reference:
          providerResult.providerSessionId ||
          providerResult.providerReference ||
          null,
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
    // 8. Keep the customer on PaySafe.
    //
    // The provider session is NOT exposed to the browser here.
    // The PaySafe payment page will retrieve the session securely.
    // ---------------------------------------------------------

    const paymentPageUrl = new URL(
      `/pay/${encodeURIComponent(token)}/payment`,
      request.nextUrl.origin
    );

    paymentPageUrl.searchParams.set(
      "paymentId",
      payment.id
    );

  
    return NextResponse.json({
      paymentUrl: paymentPageUrl.toString(),
    });

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