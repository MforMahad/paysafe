import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';
import { PayButton } from './PayButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

function formatAmount(amount: number | string, currency: string) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  return `${currency.toUpperCase()} ${num.toFixed(2)}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function checkIsExpired(expiresAt: string, isPaid: boolean, status: string): boolean {
  if (isPaid) return false;
  if (status === 'expired') return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export default async function CheckoutPage({ params }: PageProps) {
  const { token } = await params;

  if (!token?.trim()) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Payment Link</h1>
          <p className="text-slate-400 text-sm">No payment token was provided in this URL.</p>
        </div>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: linkData } = await supabase
    .from('payment_links')
    .select(`
      id,
      description,
      amount,
      currency,
      customer_name,
      customer_email,
      status,
      link_token,
      gateway_payment_id,
      paid_at,
      expires_at,
      created_at,
      merchants (
        name,
        statement_descriptor
      ),
      brands (
        name,
        customer_facing_name
      )
    `)
    .eq('link_token', token)
    .maybeSingle();

  if (!linkData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Payment Link Not Found</h1>
          <p className="text-slate-400 text-sm">
            This payment link could not be found or may have been removed. Please contact the business for a new invoice.
          </p>
        </div>
      </div>
    );
  }

  const brand = Array.isArray(linkData.brands) ? linkData.brands[0] : linkData.brands;
  const merchant = Array.isArray(linkData.merchants) ? linkData.merchants[0] : linkData.merchants;
  const brandName = brand?.customer_facing_name || brand?.name || 'PaySafe Merchant';

  const isPaid = linkData.status === 'paid' || Boolean(linkData.paid_at);
  const isCancelled = linkData.status === 'cancelled';
  const isExpired = checkIsExpired(linkData.expires_at, isPaid, linkData.status);

  // STATE 1: ALREADY COMPLETED / SETTLED (Single-Use Link Security)
  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Badge */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-3 h-3" />
              <span>SINGLE-USE LINK SETTLED</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">Payment Already Completed</h1>

            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              This payment link has already been settled and confirmed. To prevent duplicate billing, the checkout form is permanently closed.
            </p>
          </div>

          {/* Settled Details Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Amount Settled</span>
              <span className="text-emerald-400 font-bold text-base">
                {formatAmount(linkData.amount, linkData.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Description</span>
              <span className="text-white font-medium text-right truncate max-w-[200px]">
                {linkData.description}
              </span>
            </div>

            {linkData.paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Date Paid</span>
                <span className="text-slate-300">{formatDateTime(linkData.paid_at)}</span>
              </div>
            )}

            {(linkData.customer_name || linkData.customer_email) && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Billed To</span>
                <span className="text-slate-300 text-right truncate max-w-[200px]">
                  {linkData.customer_name || linkData.customer_email}
                </span>
              </div>
            )}

            {merchant?.statement_descriptor && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Descriptor</span>
                <span className="text-slate-300">{merchant.statement_descriptor}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              If you have questions about this transaction, please contact <strong className="text-white">{brandName}</strong> with reference code <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">{linkData.link_token.slice(0, 8)}</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STATE 2: EXPIRED
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">Payment Link Expired</h1>
          <p className="text-slate-400 text-sm">
            This payment request expired on {formatDateTime(linkData.expires_at)}. Please contact {brandName} to request a new link.
          </p>
        </div>
      </div>
    );
  }

  // STATE 3: CANCELLED
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-700">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">Payment Request Cancelled</h1>
          <p className="text-slate-400 text-sm">
            This payment request has been cancelled by the merchant.
          </p>
        </div>
      </div>
    );
  }

  // STATE 4: ACTIVE & READY TO PAY
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 pb-5 border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-1">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-blue-400">
            {brandName}
          </h2>
          <div className="text-3xl font-bold font-mono text-white tracking-tight">
            {formatAmount(linkData.amount, linkData.currency)}
          </div>
          <p className="text-xs text-slate-400 font-mono">Invoice Reference: {linkData.description}</p>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-3 font-mono text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Description</span>
            </span>
            <span className="text-white font-medium text-right max-w-[180px] truncate">
              {linkData.description}
            </span>
          </div>

          {(linkData.customer_name || linkData.customer_email) && (
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Customer</span>
              </span>
              <span className="text-white font-medium text-right max-w-[180px] truncate">
                {linkData.customer_name || linkData.customer_email}
              </span>
            </div>
          )}

          {merchant?.statement_descriptor && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Descriptor</span>
              <span className="text-slate-300 font-medium text-right max-w-[180px] truncate">
                {merchant.statement_descriptor}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Valid Until</span>
            </span>
            <span className="text-slate-300">{formatDateTime(linkData.expires_at)}</span>
          </div>
        </div>

        {/* Payment Action Button */}
        <PayButton token={linkData.link_token} />

        <p className="text-[11px] text-center text-slate-500 font-mono">
          Single-use secure link • Locks automatically once settled
        </p>
      </div>
    </div>
  );
}