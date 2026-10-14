'use client';

import { useEffect, useState, use } from 'react';

export default function PaymentReturnPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [status, setStatus] = useState<'verifying' | 'paid' | 'error'>('verifying');

  useEffect(() => {
    async function verifyPayment() {
      try {
        const res = await fetch(`/api/payments/verify?token=${resolvedParams.token}`);
        const data = await res.json();

        if (data.status === 'paid') {
          setStatus('paid');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    }

    verifyPayment();
  }, [resolvedParams.token]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-xl">
        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Verifying Payment...</h1>
            <p className="text-slate-400 text-sm">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'paid' && (
          <div>
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Completed</h1>
            <p className="text-slate-400 text-sm mb-6">
              Thank you! Your transaction was verified and completed successfully.
            </p>
            <div className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              Status: Verified
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h1 className="text-xl font-bold mb-2 text-rose-400">Payment Verification Issue</h1>
            <p className="text-slate-400 text-sm mb-4">
              We couldn&apos;t confirm the status automatically. If you were charged, your records will update shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}