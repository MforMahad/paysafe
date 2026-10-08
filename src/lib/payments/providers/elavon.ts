import "server-only";

import { decryptCredential } from "@/lib/security/credentials";
import type {
  PaymentProviderConfiguration,
  PaymentProviderResult,
} from "./types";

type ElavonOrderResponse = {
  id?: string;
  href?: string;
};

type ElavonPaymentSessionResponse = {
  id?: string;
  href?: string;
  hppType?: string;
};

function createBasicAuth(
  username: string,
  password: string
): string {
  return `Basic ${Buffer.from(
    `${username}:${password}`
  ).toString("base64")}`;
}

async function parseJsonResponse<T>(
  response: Response,
  operation: string
): Promise<T> {
  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Elavon ${operation} returned an invalid response (${response.status}).`
      );
    }
  }

  if (!response.ok) {
    console.error(`Elavon ${operation} failed`, {
      status: response.status,
      data,
    });

    const providerMessage =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message ===
        "string"
        ? (data as { message: string }).message
        : null;

    throw new Error(
      providerMessage
        ? `Elavon ${operation} failed (${response.status}): ${providerMessage}`
        : `Elavon ${operation} failed (${response.status}).`
    );
  }

  return data as T;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function getCheckoutOrigin(returnUrl: string): string {
  const parsed = new URL(returnUrl);
  return parsed.origin;
}

export async function createElavonPayment(
  configuration: PaymentProviderConfiguration
): Promise<PaymentProviderResult> {
  if (!configuration.merchantAliasEncrypted) {
    throw new Error(
      "Elavon merchant alias is not configured."
    );
  }

  if (!configuration.apiSecretEncrypted) {
    throw new Error(
      "Elavon API secret is not configured."
    );
  }

  if (!configuration.apiBaseUrl) {
    throw new Error(
      "Elavon API base URL is not configured."
    );
  }

  const merchantAlias = decryptCredential(
    configuration.merchantAliasEncrypted
  );

  const apiSecret = decryptCredential(
    configuration.apiSecretEncrypted
  );

  if (!merchantAlias.trim()) {
    throw new Error("Elavon merchant alias is empty.");
  }

  if (!apiSecret.trim()) {
    throw new Error("Elavon API secret is empty.");
  }

  const baseUrl = normalizeBaseUrl(
    configuration.apiBaseUrl
  );

  const originUrl = getCheckoutOrigin(
    configuration.returnUrl
  );

  const authorization = createBasicAuth(
    merchantAlias,
    apiSecret
  );

  const headers = {
    Authorization: authorization,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Version": "1",
  };

  /*
   * 1. Create Elavon Order
   *
   * Elavon's OrderInput requires:
   *
   * total.amount
   * total.currencyCode
   *
   * NOT total.currency.
   */
  const orderResponse = await fetch(
    `${baseUrl}/orders`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        total: {
          amount: Number(configuration.amount).toFixed(2),
          currencyCode:
            configuration.currency.toUpperCase(),
        },
        description:
          `PaySafe payment ${configuration.paymentId}`,
        customReference: configuration.paymentId,
        ...(configuration.customerEmail
          ? {
              shopperEmailAddress:
                configuration.customerEmail,
            }
          : {}),
      }),
      cache: "no-store",
    }
  );

  const order =
    await parseJsonResponse<ElavonOrderResponse>(
      orderResponse,
      "order creation"
    );

  if (!order.href) {
    throw new Error(
      "Elavon order creation succeeded but no order URL was returned."
    );
  }

  /*
   * 2. Create Elavon Hosted Payment Fields session
   */
  const paymentSessionResponse =
    await fetch(
      `${baseUrl}/payment-sessions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          hppType: "hostedPaymentFields",
          order: order.href,
          originUrl,
          doCreateTransaction: true,
        }),
        cache: "no-store",
      }
    );

  const paymentSession =
    await parseJsonResponse<ElavonPaymentSessionResponse>(
      paymentSessionResponse,
      "payment session creation"
    );

  if (!paymentSession.id) {
    throw new Error(
      "Elavon payment session creation succeeded but no session ID was returned."
    );
  }

  if (
    paymentSession.hppType &&
    paymentSession.hppType !==
      "hostedPaymentFields"
  ) {
    throw new Error(
      `Elavon returned an unexpected payment session type: ${paymentSession.hppType}`
    );
  }

  return {
    paymentUrl: "",
    providerSessionId: paymentSession.id,
    providerTransactionId: null,
    providerReference: paymentSession.id,
  };
}