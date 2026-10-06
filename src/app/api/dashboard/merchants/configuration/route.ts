import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/security/credentials";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const merchantId = String(body.merchantId ?? "").trim();
    const providerCode = String(body.providerCode ?? "").trim().toLowerCase();
    const apiBaseUrl = String(body.apiBaseUrl ?? "").trim();
    const apiKey = String(body.apiKey ?? "").trim();
    const apiSecret = String(body.apiSecret ?? "").trim();
    const merchantAlias = String(body.merchantAlias ?? "").trim();

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID is required." },
        { status: 400 }
      );
    }

    if (!providerCode) {
      return NextResponse.json(
        { error: "Provider code is required." },
        { status: 400 }
      );
    }

    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "API base URL is required." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(apiBaseUrl);
    } catch {
      return NextResponse.json(
        { error: "API base URL must be a valid URL." },
        { status: 400 }
      );
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "API base URL must use HTTPS." },
        { status: 400 }
      );
    }

    if (!apiSecret) {
      return NextResponse.json(
        { error: "API secret is required." },
        { status: 400 }
      );
    }

    if (providerCode === "elavon_epg" && !merchantAlias) {
      return NextResponse.json(
        { error: "Elavon merchant alias is required." },
        { status: 400 }
      );
    }

    const encryptedApiKey = apiKey
      ? encryptCredential(apiKey)
      : "";

    const encryptedApiSecret = encryptCredential(apiSecret);

    const encryptedMerchantAlias =
      providerCode === "elavon_epg" && merchantAlias
        ? encryptCredential(merchantAlias)
        : "";

    const { data: savedMerchantId, error: saveError } =
      await supabase.rpc("save_merchant_api_configuration", {
        p_merchant_id: merchantId,
        p_provider_code: providerCode,
        p_api_base_url: apiBaseUrl,
        p_api_key_encrypted: encryptedApiKey,
        p_api_secret_encrypted: encryptedApiSecret,
        p_merchant_alias_encrypted: encryptedMerchantAlias,
      });

    if (saveError) {
      console.error(
        "Failed to save merchant API configuration:",
        saveError.message
      );

      return NextResponse.json(
        { error: "Unable to save merchant API configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      merchantId: savedMerchantId,
    });
  } catch (error) {
    console.error(
      "Merchant API configuration error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to save merchant API configuration." },
      { status: 500 }
    );
  }
}