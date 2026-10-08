  import { notFound } from "next/navigation";
  import { createClient } from "@/lib/supabase/server";
  import PaymentButton from "./components/PaymentButton";

  type PublicPaymentLink = {
    id: string;
    description: string;
    amount: number | string;
    currency: string;
    customer_name: string | null;
    status: "active" | "expired" | "cancelled";
    expires_at: string;
    brand_name: string;
    customer_facing_name: string | null;
    logo_url: string | null;
  };

  type PaymentPageProps = {
    params: Promise<{
      token: string;
    }>;
  };

  function formatAmount(
    amount: number | string,
    currency: string
  ) {
    const numericAmount =
      typeof amount === "number" ? amount : Number(amount);

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${currency.toUpperCase()} ${numericAmount.toFixed(2)}`;
    }
  }

  function formatExpiration(value: string) {
    return new Date(value).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  export default async function PaymentPage({
    params,
  }: PaymentPageProps) {
    const { token } = await params;

    if (!token?.trim()) {
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
        "Failed to load public payment link:",
        error
      );

      notFound();
    }

    const paymentLink =
      (data?.[0] as PublicPaymentLink | undefined) ?? null;

    if (!paymentLink) {
      notFound();
    }

    const isExpired = paymentLink.status === "expired";
    const isCancelled = paymentLink.status === "cancelled";
    const isUnavailable = isExpired || isCancelled;

    const brandDisplayName =
      paymentLink.customer_facing_name ||
      paymentLink.brand_name;

    const brandInitial =
      brandDisplayName.charAt(0).toUpperCase();

    return (
      <main className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
        <div className="min-h-screen flex flex-col">

          {/* HEADER */}
          <header className="border-b border-[#E2E8F0] bg-white">
            <div className="mx-auto flex h-[76px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
              
              <div className="flex min-w-0 items-center gap-3.5">
                {paymentLink.logo_url ? (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                    <img
                      src={paymentLink.logo_url}
                      alt={brandDisplayName}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] text-sm font-bold text-white">
                    {brandInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0F172A]">
                    {brandDisplayName}
                  </p>

                  {paymentLink.brand_name !== brandDisplayName && (
                    <p className="truncate text-xs text-[#64748B]">
                      {paymentLink.brand_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8] sm:block">
                  Secure checkout
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-[#315BFF]"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <rect
                      x="4.5"
                      y="10"
                      width="15"
                      height="10"
                      rx="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 14v2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <span className="text-xs font-semibold text-[#0F172A]">
                  PaySafe
                </span>
              </div>
            </div>
          </header>

          {/* MAIN */}
          <section className="flex flex-1 items-start justify-center px-5 py-10 sm:px-8 sm:py-16">
            <div className="w-full max-w-[560px]">

              {/* EYEBROW */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#315BFF]" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
                    Payment request
                  </span>
                </div>

                {!isUnavailable && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                    Active
                  </span>
                )}

                {isExpired && (
                  <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B45309]">
                    Expired
                  </span>
                )}

                {isCancelled && (
                  <span className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                    Cancelled
                  </span>
                )}
              </div>

              {/* PAYMENT PANEL */}
              <div className="overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">

                {/* TOP CONTENT */}
                <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10 sm:pt-9">

                  <div className="max-w-[470px]">
                    <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.035em] text-[#0B132B] sm:text-[34px]">
                      {paymentLink.description}
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-[#64748B]">
                      Payment requested by{" "}
                      <span className="font-medium text-[#334155]">
                        {brandDisplayName}
                      </span>
                      .
                    </p>
                  </div>

                  {/* AMOUNT */}
                  <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5 sm:px-6 sm:py-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
                      Amount due
                    </p>

                    <p className="mt-2 text-[38px] font-semibold leading-none tracking-[-0.045em] text-[#0B132B] sm:text-[46px]">
                      {formatAmount(
                        paymentLink.amount,
                        paymentLink.currency
                      )}
                    </p>
                  </div>

                  {/* DETAILS */}
                  <div className="mt-8 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">

                    {paymentLink.customer_name && (
                      <div className="flex items-center justify-between gap-6 py-4">
                        <span className="text-xs font-medium text-[#64748B]">
                          Customer
                        </span>

                        <span className="text-right text-sm font-semibold text-[#0F172A]">
                          {paymentLink.customer_name}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-6 py-4">
                      <span className="text-xs font-medium text-[#64748B]">
                        Currency
                      </span>

                      <span className="text-sm font-semibold uppercase text-[#0F172A]">
                        {paymentLink.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-6 py-4">
                      <span className="text-xs font-medium text-[#64748B]">
                        {isExpired
                          ? "Expired"
                          : "Payment link expires"}
                      </span>

                      <span className="text-right text-sm font-medium text-[#0F172A]">
                        {formatExpiration(
                          paymentLink.expires_at
                        )}
                      </span>
                    </div>

                  </div>

                  {/* ACTION */}
                  <div className="mt-8">
                    {!isUnavailable ? (
                      <PaymentButton
                        token={token}
                        disabled={isUnavailable}
                      />
                    ) : (
                      <div className="flex h-12 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-semibold text-[#64748B]">
                        {isExpired
                          ? "This payment link has expired"
                          : "This payment link is no longer available"}
                      </div>
                    )}
                  </div>

                  {!isUnavailable && (
                    <p className="mt-4 text-center text-[11px] leading-5 text-[#94A3B8]">
                      You will continue to a secure payment
                      provider to complete your payment.
                    </p>
                  )}
                </div>

                {/* TRUST FOOTER */}
                <div className="border-t border-[#E2E8F0] bg-[#FBFCFE] px-6 py-4 sm:px-9">
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    
                    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 text-[#315BFF]"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 3.5 19 6v5.5c0 4.35-2.7 7.65-7 9-4.3-1.35-7-4.65-7-9V6l7-2.5Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path
                          d="m9.2 12 1.8 1.8 3.8-4"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span>
                        Secure payment experience
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                      Powered by PaySafe Gateway
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM BRANDING */}
              <div className="mt-7 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CBD5E1]">
                  PaySafe Gateway
                </p>
              </div>

            </div>
          </section>
        </div>
      </main>
    );
  }