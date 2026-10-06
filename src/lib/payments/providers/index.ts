import "server-only";

import type {
  PaymentProviderConfiguration,
  PaymentProviderResult,
} from "./types";

import { createMockGatewayPayment } from "./mockgateway";
import { createElavonPayment } from "./elavon";

export async function createProviderPayment(
  configuration: PaymentProviderConfiguration
): Promise<PaymentProviderResult> {
  switch (
    configuration.providerCode.trim().toLowerCase()
  ) {
    case "mockgateway":
      return createMockGatewayPayment(configuration);

    case "elavon_epg":
      return createElavonPayment(configuration);

    default:
      throw new Error(
        `Unsupported payment provider: ${configuration.providerCode}`
      );
  }
}