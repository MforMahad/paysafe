"use client";

import { useState } from "react";

type PaymentButtonProps = {
  token: string;
  disabled?: boolean;
};

type PaymentStartResponse = {
  paymentUrl?: string;
  error?: string;
};

function createIdempotencyKey() {
  return crypto.randomUUID();
}

export default function PaymentButton({
  token,
  disabled = false,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    if (isLoading || disabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/payments/start?token=${encodeURIComponent(
          token
        )}`,
        {
          method: "POST",
          headers: {
            "Idempotency-Key": createIdempotencyKey(),
          },
          cache: "no-store",
        }
      );

      let data: PaymentStartResponse = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The payment server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start the payment. Please try again."
        );
      }

      if (
        typeof data.paymentUrl !== "string" ||
        !data.paymentUrl
      ) {
        throw new Error(
          "The payment server did not return a payment page."
        );
      }

      window.location.assign(data.paymentUrl);
    } catch (paymentError) {
      console.error(
        "Payment start failed:",
        paymentError
      );

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to start the payment. Please try again."
      );

      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className="inline-flex w-full items-center justify-center rounded-md bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Preparing payment..."
          : "Continue to Payment"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-center text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}