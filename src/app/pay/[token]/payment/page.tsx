import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import PaymentForm from "./components/PaymentForm";

type PaymentPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    paymentId?: string;
  }>;
};

type PublicPaymentLink = {
  id: string;
  description: string | null;
  amount: number;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  status: "active" | "expired" | "cancelled";
  expires_at: string | null;
  brand_name: string | null;
  customer_facing_name: string | null;
  logo_url: string | null;
};

export default async function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const { token } = await params;
  const { paymentId } = await searchParams;

  if (!token || !paymentId) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_public_payment_link",
    {
      p_link_token: token.trim(),
    }
  );

  if (error) {
    console.error(
      "Payment page public-link lookup failed:",
      error
    );

    throw new Error(
      "Unable to load the payment request."
    );
  }

  /*
   * get_public_payment_link returns an array.
   * This RPC should resolve to one public payment link.
   */
  const payment = Array.isArray(data)
    ? (data[0] as PublicPaymentLink | undefined)
    : (data as PublicPaymentLink | null);

  if (!payment) {
    notFound();
  }

  if (payment.status !== "active") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {payment.logo_url ? (
              <img
                src={payment.logo_url}
                alt={
                  payment.customer_facing_name ??
                  payment.brand_name ??
                  "Business"
                }
                className="h-12 max-w-[180px] object-contain"
              />
            ) : (
              <div className="flex h-12 items-center rounded-lg bg-[#0B132B] px-4 text-sm font-semibold text-white">
                {payment.customer_facing_name ??
                  payment.brand_name ??
                  "PaySafe"}
              </div>
            )}
          </div>

          <p className="text-sm font-medium text-[#64748B]">
            Secure Payment
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">
            Payment Details
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Enter your payment information to complete this
            payment request.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748B]">
                  Payment Request
                </p>

                <p className="mt-2 truncate text-sm font-medium text-[#0F172A]">
                  {payment.description ??
                    "Payment request"}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-[#64748B]">
                  Amount
                </p>

                <p className="mt-1 text-xl font-semibold text-[#0F172A]">
                  {payment.currency.toUpperCase()}{" "}
                  {Number(payment.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <PaymentForm
            paymentId={paymentId}
            token={token}
            amount={Number(payment.amount)}
            currency={payment.currency}
            customerName={payment.customer_name}
            customerEmail={payment.customer_email}
          />
        </section>

        <div className="mt-6 text-center text-xs text-[#64748B]">
          <p>
            Your payment information is securely handled by
            the payment processor.
          </p>

          <p className="mt-1">
            Powered by PaySafe Gateway
          </p>
        </div>
      </div>
    </main>
  );
}