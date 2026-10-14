'use client';

import { useState } from 'react';
import { Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface PayButtonProps {
  token: string;
}

export function PayButton({ token }: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/start?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start payment');
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned from payment processor.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      <button
        onClick={handleStartPayment}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-wider font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Connecting to Gateway...</span>
          </>
        ) : (
          <>
            <span>Proceed to Secure Payment</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>256-bit Encrypted Checkout via Elavon</span>
      </div>
    </div>
  );
}

