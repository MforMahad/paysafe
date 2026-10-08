import "server-only";

export type PaymentProviderConfiguration = {
  paymentId: string;
  merchantId: string;
  businessId: string;
  amount: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  providerCode: string;
  apiBaseUrl: string;
  apiKeyEncrypted: string | null;
  apiSecretEncrypted: string;
  merchantAliasEncrypted: string | null;
  returnUrl: string;
};

export type PaymentProviderResult = {
  paymentUrl: string;
  providerSessionId?: string | null;
  providerTransactionId?: string | null;
  providerReference?: string | null;
};