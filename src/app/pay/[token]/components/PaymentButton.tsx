"use client";

import { useState } from "react";

type PaymentButtonProps = {
  token: string;
  disabled?: boolean;
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
  
    const idempotencyKey = createIdempotencyKey();
  
    try {
      const response = await fetch(
        `/api/payments/start?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );
  
      let data: {
        paymentUrl?: string;
        error?: string;
      } = {};
  
      try {
        data = await response.json();
      } catch {
        // Keep the default error below.
      }
  
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start the payment. Please try again."
        );
      }
  
      if (!data.paymentUrl) {
        throw new Error(
          "Payment provider did not return a checkout URL."
        );
      }
  
      window.location.assign(data.paymentUrl);
    } catch (paymentError) {
      console.error("Payment start failed:", paymentError);
  
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
        {isLoading ? "Preparing payment..." : "Continue to Payment"}
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