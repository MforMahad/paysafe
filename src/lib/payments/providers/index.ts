import "server-only";

import type {
  PaymentProviderConfiguration,
  PaymentProviderResult,
} from "./types";

import {
  createMockGatewayPayment,
} from "./mockgateway";

export async function createProviderPayment(
  configuration: PaymentProviderConfiguration
): Promise<PaymentProviderResult> {
  switch (
    configuration.providerCode.trim().toLowerCase()
  ) {
    case "mockgateway":
      return createMockGatewayPayment(configuration);

    default:
      throw new Error(
        `Unsupported payment provider: ${configuration.providerCode}`
      );
  }
}