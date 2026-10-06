import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type PaymentResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PaymentResultPage({
  params,
}: PaymentResultPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: payments, error } = await supabase.rpc(
    "get_public_payment_result",
    {
      p_payment_id: id,
    }
  );
  
  const payment = payments?.[0];
  
  if (error || !payment) {
    notFound();
  }
  

  const status = payment.status;

  const isConfirmed = status === "confirmed";
  const isFailed =
    status === "failed" ||
    status === "cancelled";
  const isProcessing = status === "processing";
  const isPending = status === "pending";

  let title = "Payment Processing";
  let message =
    "Your payment is being processed. You can safely close this page.";

  if (isConfirmed) {
    title = "Payment Successful";
    message =
      "Your payment has been confirmed successfully.";
  } else if (isFailed) {
    title = "Payment Unsuccessful";
    message =
      "Your payment could not be completed.";
  } else if (isPending) {
    title = "Payment Pending";
    message =
      "Your payment has not been completed yet.";
  } else if (isProcessing) {
    title = "Payment Processing";
    message =
      "Your payment is being processed. Please wait for confirmation.";
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-6 py-16 text-[#0F172A]">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748B]">
              PaySafe Gateway
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {title}
            </h1>

            <p className="mt-3 leading-7 text-[#64748B]">
              {message}
            </p>
          </div>

          <div className="border-t border-[#E2E8F0] pt-6">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#64748B]">
                Amount
              </span>

              <span className="font-semibold">
                {Number(payment.amount).toFixed(2)}{" "}
                {payment.currency}
              </span>
            </div>

            {payment.customer_name && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#64748B]">
                  Customer
                </span>

                <span className="font-medium">
                  {payment.customer_name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#64748B]">
                Status
              </span>

              <span className="font-medium capitalize">
                {status}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            >
              Return to PaySafe
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}