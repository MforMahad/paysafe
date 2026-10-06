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
    returnUrl: string;
  };
  
  export type PaymentProviderResult = {
    paymentUrl: string;
    providerTransactionId?: string | null;
    providerReference?: string | null;
  };