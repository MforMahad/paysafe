"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSent(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>

      <div className="mb-8">
        <div className="w-11 h-11 rounded-lg bg-[#0B132B] text-white flex items-center justify-center mb-5">
          <Mail className="w-5 h-5" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Reset your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter the email address associated with your PaySafe account and
          we&apos;ll send you a password reset link.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

            <div>
              <h2 className="text-sm font-semibold text-emerald-900">
                Check your email
              </h2>

              <p className="mt-1 text-sm leading-5 text-emerald-700">
                If an account exists for that email address, you&apos;ll
                receive a password reset link shortly.
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center mt-5 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800 hover:text-emerald-950"
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 mb-2"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 disabled:bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}