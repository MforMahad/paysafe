import "server-only";

import { decryptCredential } from "@/lib/security/credentials";
import type {
  PaymentProviderConfiguration,
  PaymentProviderResult,
} from "./types";

type ElavonOrderResponse = {
  href?: string;
  id?: string;
};

type ElavonPaymentSessionResponse = {
  href?: string;
  id?: string;
  url?: string;
  hppType?: string;
  returnUrl?: string;
  cancelUrl?: string;
};

function createBasicAuth(
  merchantAlias: string,
  apiSecret: string
) {
  return Buffer.from(
    `${merchantAlias}:${apiSecret}`,
    "utf8"
  ).toString("base64");
}

async function parseJsonResponse<T>(
  response: Response,
  operation: string
): Promise<T> {
  const responseText = await response.text();

  let data: T;

  try {
    data = JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `Elavon ${operation} returned an invalid JSON response (${response.status}).`
    );
  }

  if (!response.ok) {
    console.error(`Elavon ${operation} failed:`, {
      status: response.status,
      response: data,
    });

    throw new Error(
      `Elavon ${operation} failed (${response.status}).`
    );
  }

  return data;
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

  const merchantAlias = decryptCredential(
    configuration.merchantAliasEncrypted
  );

  const apiSecret = decryptCredential(
    configuration.apiSecretEncrypted
  );

  const baseUrl = configuration.apiBaseUrl
    .trim()
    .replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error(
      "Elavon API base URL is not configured."
    );
  }

  const authorization = createBasicAuth(
    merchantAlias,
    apiSecret
  );

  const headers = {
    Authorization: `Basic ${authorization}`,
    Accept: "application/json;charset=UTF-8",
    "Accept-Version": "1",
    "Content-Type": "application/json;charset=UTF-8",
  };

  // ---------------------------------------------------------
  // 1. Create Elavon Order
  // ---------------------------------------------------------

  const orderResponse = await fetch(
    `${baseUrl}/orders`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        total: {
          amount: Number(configuration.amount).toFixed(2),
          currencyCode: configuration.currency.trim().toUpperCase(),
        },
        description: `PaySafe payment ${configuration.paymentId}`,
        customReference: configuration.paymentId,
        ...(configuration.customerEmail
          ? {
              shopperEmailAddress: configuration.customerEmail,
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
      "Elavon order creation did not return an order resource URL."
    );
  }

  // ---------------------------------------------------------
  // 2. Create Elavon Payment Session
  // ---------------------------------------------------------

  const paymentSessionResponse = await fetch(
    `${baseUrl}/payment-sessions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        order: order.href,
        returnUrl: configuration.returnUrl,
        cancelUrl: configuration.returnUrl,
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

  // The EPG PaymentSession resource exposes `url` as the
  // URL shoppers use for the hosted payment page.
  if (!paymentSession.url) {
    console.error(
      "Elavon payment session did not contain a checkout URL:",
      {
        id: paymentSession.id,
        href: paymentSession.href,
        hppType: paymentSession.hppType,
      }
    );

    throw new Error(
      "Elavon payment session did not return a hosted checkout URL."
    );
  }

  return {
    paymentUrl: paymentSession.url,
    providerTransactionId: null,
    providerReference:
      paymentSession.id || order.id || null,
  };
}