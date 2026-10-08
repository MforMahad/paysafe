"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type PaymentFormProps = {
  paymentId: string;
  token: string;
  amount: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
};

type ElavonHostedFieldsMessage = {
  type?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

type ElavonShopperInfo = {
    shopperEmailAddress?: string;
  };
  
  type ElavonHostedFieldsInstance = {
    submit: (shopperInfo?: ElavonShopperInfo) => void;
    getState?: () => unknown;
    destroy?: () => void;
  };

type ElavonHostedFieldsOptions = {
  sessionId: string;
  fields: Record<string, unknown>;
  styles?: Record<string, unknown>;
  onReady?: () => void;
  onTransactionSubmission?: (message?: unknown) => void;
  messageHandler?: (
    message: ElavonHostedFieldsMessage
  ) => void;
  hideUntilRequested?: boolean;
};

declare global {
  interface Window {
    ElavonHostedFields?: new (
      options: ElavonHostedFieldsOptions
    ) => ElavonHostedFieldsInstance;
  }
}

const ELAVON_HOSTED_FIELDS_SCRIPT =
  "https://uat.hpp.converge.eu.elavonaws.com/hosted-fields-client/index.js";

export default function PaymentForm({
  paymentId,
  token,
  amount,
  currency,
  customerName,
  customerEmail,
}: PaymentFormProps) {
  const hostedFieldsRef =
    useRef<ElavonHostedFieldsInstance | null>(null);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [scriptReady, setScriptReady] =
    useState(false);

  const [loadingSession, setLoadingSession] =
    useState(true);

  const [fieldsReady, setFieldsReady] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setLoadingSession(true);
      setError(null);
      setFieldsReady(false);

      const response = await fetch(
        `/api/payments/session?paymentId=${encodeURIComponent(
          paymentId
        )}&token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to load the payment session."
        );
      }

      if (
        typeof data?.providerSessionId !== "string" ||
        !data.providerSessionId.trim()
      ) {
        throw new Error(
          "Payment provider session is unavailable."
        );
      }

      setSessionId(data.providerSessionId);
    } catch (sessionError) {
      console.error(
        "Payment session loading failed:",
        sessionError
      );

      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Unable to load the payment session."
      );
    } finally {
      setLoadingSession(false);
    }
  }, [paymentId, token]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionId) return;
    if (!scriptReady) return;
    if (!window.ElavonHostedFields) return;
    if (hostedFieldsRef.current) return;

    const HostedFields =
      window.ElavonHostedFields;

    setError(null);
    setFieldsReady(false);
    setSubmitting(false);

    try {
      const hostedFields = new HostedFields({
        sessionId,

        /*
         * These are the exact field types from
         * Elavon's current Hosted Fields documentation.
         */
        fields: {
          cardholderName: {
            wrapperId: "paysafe-cardholder-name",
            placeholder: "Name on card",
            ariaLabel: "Cardholder name",
            required: "true",
          },

          cardNumber: {
            wrapperId: "paysafe-card-number",
            placeholder: "Card number",
            ariaLabel: "Card number",
            required: "true",
          },

          cardExpirationDate: {
            wrapperId: "paysafe-card-expiration",
            placeholder: "MM/YY",
            ariaLabel: "Card expiration date",
            required: "true",
          },

          cardCvv: {
            wrapperId: "paysafe-card-cvv",
            placeholder: "CVV",
            ariaLabel: "Card security code",
            required: "true",
          },
        },

        /*
         * className styles the iframe wrapper itself.
         * This is the correct place to control the
         * field height according to Elavon's docs.
         */
        styles: {
          input: {
            width: "100%",
            padding: "10px",
            fontSize: "15px",
            color: "#0F172A",
            backgroundColor: "#FFFFFF",
            border: "0",
            borderRadius: "8px",
            boxSizing: "border-box",
          },

          "input::placeholder": {
            color: "#94A3B8",
          },

          "input:focus": {
            outline: "none",
          },

          ".field-error": {
            border: "1px solid #DC2626",
          },
        },

        hideUntilRequested: false,

        onReady: () => {
          console.log(
            "Elavon Hosted Fields ready."
          );

          setFieldsReady(true);
          setSubmitting(false);
          setError(null);
        },

        onTransactionSubmission: (message) => {
          console.log(
            "Elavon transaction submission:",
            JSON.stringify(message, null, 2)
          );

          setSubmitting(true);
          setError(null);
        },

        messageHandler: (message) => {
          console.log(
            "Elavon Hosted Fields message:",
            JSON.stringify(message, null, 2)
          );

          switch (message?.type) {
            case "fieldValidityChanged":
              break;

            case "fieldFocusChanged":
              break;

            case "transactionCreated":
              /*
               * Do not mark PaySafe confirmed here.
               * The Elavon webhook is the source of truth.
               */
              setSubmitting(false);
              break;

            case "error": {
              console.error(
                "Elavon Hosted Fields error:",
                message
              );

              setSubmitting(false);

              const messageText =
                typeof message?.message === "string"
                  ? message.message
                  : typeof message?.error === "string"
                    ? message.error
                    : "Unable to process the payment.";

              setError(messageText);
              break;
            }

            default:
              break;
          }
        },
      });

      hostedFieldsRef.current = hostedFields;
    } catch (initializationError) {
      console.error(
        "Elavon Hosted Fields initialization failed:",
        initializationError
      );

      hostedFieldsRef.current = null;
      setFieldsReady(false);

      setError(
        "Unable to initialize the secure payment form."
      );
    }

    return () => {
      if (hostedFieldsRef.current?.destroy) {
        try {
          hostedFieldsRef.current.destroy();
        } catch (destroyError) {
          console.error(
            "Elavon Hosted Fields cleanup failed:",
            destroyError
          );
        }
      }

      hostedFieldsRef.current = null;
      setFieldsReady(false);
    };
  }, [sessionId, scriptReady]);

  async function handleRetry() {
    try {
      setError(null);
      setSubmitting(true);

      const idempotencyKey = crypto.randomUUID();

      const response = await fetch(
        `/api/payments/start?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
          cache: "no-store",
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to start a new payment attempt."
        );
      }
      
      if (
        typeof data?.paymentUrl !== "string" ||
        !data.paymentUrl.trim()
      ) {
        throw new Error(
          "New payment page URL was not returned."
        );
      }
      
      window.location.assign(data.paymentUrl);
      
    } catch (retryError) {
      console.error(
        "Payment retry failed:",
        retryError
      );

      setSubmitting(false);

      setError(
        retryError instanceof Error
          ? retryError.message
          : "Unable to start a new payment attempt."
      );
    }
  }


  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
  
    if (submitting) {
      return;
    }
  
    const hostedFields = hostedFieldsRef.current;
  
    if (!hostedFields) {
      setError("The secure payment form is not ready yet.");
      return;
    }
  
    if (!fieldsReady) {
      setError(
        "Please wait for the secure payment form to finish loading."
      );
      return;
    }
  
    setError(null);
  
    try {
      const state = hostedFields.getState?.();
  
      console.log("Elavon Hosted Fields state:", state);
  
      if (
        !state ||
        typeof state !== "object" ||
        !("isValid" in state) ||
        !(state as { isValid?: boolean }).isValid
      ) {
        setSubmitting(false);
        setError(
          "Please check your card details and try again."
        );
        return;
      }
  
      setSubmitting(true);
  
      hostedFields.submit({
        shopperEmailAddress: customerEmail || undefined,
      });
    } catch (submitError) {
      console.error(
        "Elavon Hosted Fields submission failed:",
        submitError
      );
  
      setSubmitting(false);
      setError(
        "Unable to submit the payment. Please try again."
      );
    }
  }

  const showLoading =
    loadingSession ||
    !scriptReady ||
    !sessionId;

  return (
    <>
      <Script
        src={ELAVON_HOSTED_FIELDS_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => {
          console.log(
            "Elavon Hosted Fields library loaded."
          );

          setScriptReady(true);
        }}
        onError={() => {
          console.error(
            "Unable to load Elavon Hosted Fields library."
          );

          setScriptReady(false);

          setError(
            "Unable to load the secure payment fields."
          );
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="px-6 py-6 sm:px-8"
      >
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#0F172A]">
            Payment Information
          </p>

          <p className="mt-1 text-sm text-[#64748B]">
            Your card details are entered securely through
            Elavon.
          </p>
        </div>

        {showLoading ? (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 text-sm text-[#64748B]">
            Preparing secure payment fields...
          </div>
             ) : error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-5"
          >
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Preparing New Payment..."
                : "Try Again"}
            </button>
          </div>
          
        ) : (
          <div className="space-y-5">
            {/* Cardholder */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Cardholder Name
              </label>

              <div
                id="paysafe-cardholder-name"
                className="h-12 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Card Number
              </label>

              <div
                id="paysafe-card-number"
                className="h-12 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white"
              />
            </div>

            {/* Expiry / CVV */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#334155]">
                  Expiry Date
                </label>

                <div
                  id="paysafe-card-expiration"
                  className="h-12 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#334155]">
                  Security Code
                </label>

                <div
                  id="paysafe-card-cvv"
                  className="h-12 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white"
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-lg bg-[#F8FAFC] px-4 py-3 text-xs leading-5 text-[#64748B]">
              Payment amount:{" "}
              <span className="font-medium text-[#334155]">
                {currency.toUpperCase()}{" "}
                {amount.toFixed(2)}
              </span>

              {customerEmail && (
                <>
                  {" "}
                  · Receipt email:{" "}
                  <span className="font-medium text-[#334155]">
                    {customerEmail}
                  </span>
                </>
              )}
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={!fieldsReady || submitting}
              className="w-full rounded-lg bg-[#2563EB] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Processing Payment..."
                : `Pay ${currency.toUpperCase()} ${amount.toFixed(2)}`}
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Secure payment form
        </div>
      </form>
    </>
  );
}