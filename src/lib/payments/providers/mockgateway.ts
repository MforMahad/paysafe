import "server-only";

import {
  decryptCredential,
} from "@/lib/security/credentials";

import type {
  PaymentProviderConfiguration,
  PaymentProviderResult,
} from "./types";

type MockGatewayResponse = {
  payment_url?: string;
  id?: string;
  payment_id?: string;
};

export async function createMockGatewayPayment(
  configuration: PaymentProviderConfiguration
): Promise<PaymentProviderResult> {
  const apiSecret = decryptCredential(
    configuration.apiSecretEncrypted
  );

  const baseUrl = configuration.apiBaseUrl.replace(/\/+$/, "");

  const endpoint = `${baseUrl}/v1/payment_intents`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
        amount: Number(configuration.amount),
        currency: configuration.currency.toUpperCase(),
        description: `PaySafe payment ${configuration.paymentId}`,
        customer:
          configuration.customerName ||
          configuration.customerEmail ||
          configuration.paymentId,
        metadata: [],
        receipt_email: configuration.customerEmail || undefined,
        return_url: configuration.returnUrl,
      }),
    cache: "no-store",
  });

  const responseText = await response.text();

  let data: MockGatewayResponse;

  try {
    data = JSON.parse(responseText) as MockGatewayResponse;
  } catch {
    throw new Error(
      `MockGateway returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      `MockGateway payment creation failed (${response.status}).`
    );
  }

  if (!data.payment_url) {
    console.error("MockGateway response shape:", {
      status: response.status,
      keys: Object.keys(data),
      hasPaymentUrl: typeof data.payment_url === "string",
      responseLength: responseText.length,
    });
  
    throw new Error(
      "MockGateway did not return a payment URL."
    );
  }

  return {
    paymentUrl: data.payment_url,
    providerTransactionId:
      data.id ||
      data.payment_id ||
      null,
    providerReference:
      data.payment_id ||
      data.id ||
      null,
  };
}