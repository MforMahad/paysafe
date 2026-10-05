import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PublicPaymentLink = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  status: 'active' | 'expired' | 'cancelled';
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
    typeof amount === 'number'
      ? amount
      : Number(amount);

  return `${currency.toUpperCase()} ${numericAmount.toFixed(2)}`;
}

function formatExpiration(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
    'get_public_payment_link',
    {
      p_link_token: token.trim(),
    }
  );

  if (error) {
    console.error(
      'Failed to load public payment link:',
      error
    );

    notFound();
  }

  const paymentLink =
    (data?.[0] as PublicPaymentLink | undefined) ??
    null;

  if (!paymentLink) {
    notFound();
  }

  const isExpired =
    paymentLink.status === 'expired';

  const isCancelled =
    paymentLink.status === 'cancelled';

  const isUnavailable =
    isExpired || isCancelled;

  const brandDisplayName =
    paymentLink.customer_facing_name ||
    paymentLink.brand_name;

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <div className="min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="border-b border-[#E2E8F0] bg-white">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {paymentLink.logo_url ? (
                  <img
                    src={paymentLink.logo_url}
                    alt={brandDisplayName}
                    className="w-10 h-10 rounded-lg object-contain border border-[#E2E8F0] bg-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#0B132B] text-white flex items-center justify-center text-sm font-bold">
                    {brandDisplayName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {brandDisplayName}
                  </p>

                  {paymentLink.brand_name !==
                    brandDisplayName && (
                    <p className="text-xs text-[#64748B]">
                      {paymentLink.brand_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                PAYSAFE
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <div className="flex-1 flex items-start justify-center px-6 py-12 sm:py-20">
          <div className="w-full max-w-lg">
            {/* PAYMENT CARD */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
              <div className="p-7 sm:p-9">
                {/* LABEL */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                    Payment Request
                  </span>

                  {!isUnavailable && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">
                      Active
                    </span>
                  )}

                  {isExpired && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
                      Expired
                    </span>
                  )}

                  {isCancelled && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
                      Cancelled
                    </span>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div className="mt-6">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                    {paymentLink.description}
                  </h1>

                  <p className="mt-2 text-sm text-[#64748B]">
                    Payment requested by{' '}
                    {brandDisplayName}.
                  </p>
                </div>

                {/* AMOUNT */}
                <div className="mt-8 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                    Amount Due
                  </p>

                  <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[#0B132B]">
                    {formatAmount(
                      paymentLink.amount,
                      paymentLink.currency
                    )}
                  </p>
                </div>

                {/* CUSTOMER */}
                {paymentLink.customer_name && (
                  <div className="mt-7">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                      Customer
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                      {paymentLink.customer_name}
                    </p>
                  </div>
                )}

                {/* EXPIRATION */}
                <div className="mt-7">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                    {isExpired
                      ? 'Expired'
                      : 'Payment Link Expires'}
                  </p>

                  <p className="mt-2 text-sm text-[#0F172A]">
                    {formatExpiration(
                      paymentLink.expires_at
                    )}
                  </p>
                </div>

                {/* ACTION */}
                <div className="mt-9">
                  <button
                    type="button"
                    disabled={isUnavailable}
                    className={`w-full rounded-lg px-5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                      isUnavailable
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                        : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    }`}
                  >
                    {isExpired
                      ? 'Payment Link Expired'
                      : isCancelled
                        ? 'Payment Link Cancelled'
                        : 'Continue to Payment'}
                  </button>
                </div>

                {!isUnavailable && (
                  <p className="mt-4 text-center text-[11px] leading-relaxed text-[#64748B]">
                    You will be redirected to the
                    payment provider to complete your
                    payment.
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 text-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Powered by PaySafe Gateway
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}