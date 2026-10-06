import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/security/credentials";

type ConfigurationRequest = {
  merchantId?: string;
  providerCode?: string;
  apiBaseUrl?: string;
  apiKey?: string | null;
  apiSecret?: string | null;
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as ConfigurationRequest;

    const merchantId = body.merchantId?.trim();
    const providerCode = body.providerCode?.trim().toLowerCase();
    const apiBaseUrl = body.apiBaseUrl?.trim();
    const apiKey = body.apiKey?.trim() || "";
    const apiSecret = body.apiSecret?.trim() || "";

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

    if (!apiSecret) {
      return NextResponse.json(
        { error: "API credential is required." },
        { status: 400 }
      );
    }

    // Make sure the URL is actually HTTPS.
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(apiBaseUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid API base URL." },
        { status: 400 }
      );
    }

    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "API base URL must use HTTPS." },
        { status: 400 }
      );
    }

    // Never store plaintext credentials.
    const encryptedApiKey = apiKey
      ? encryptCredential(apiKey)
      : null;

    const encryptedApiSecret = encryptCredential(apiSecret);

    const { data, error } = await supabase.rpc(
      "save_merchant_api_configuration",
      {
        p_merchant_id: merchantId,
        p_provider_code: providerCode,
        p_api_base_url: apiBaseUrl,
        p_api_key_encrypted: encryptedApiKey,
        p_api_secret_encrypted: encryptedApiSecret,
      }
    );

    if (error) {
      console.error(
        "Failed to save merchant API configuration:",
        error.message
      );

      return NextResponse.json(
        { error: "Unable to save merchant API configuration." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      merchantId: data,
    });
  } catch (error) {
    console.error("Merchant configuration error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}