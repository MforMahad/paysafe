"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new one."
        );
      }

      setLoading(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.replace("/auth/login?reset=success");
  }

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <div className="text-sm text-slate-500">
          Verifying your password reset link...
        </div>
      </div>
    );
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
          <LockKeyhole className="w-5 h-5" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Set a new password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Choose a new password for your PaySafe account.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 mb-2"
            >
              New password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              disabled={saving}
              className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 mb-2"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              disabled={saving}
              className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 disabled:bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Updating password..." : "Update password"}
          </button>
        </form>
      )}

      {error && (
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center w-full h-11 mt-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Request a new reset link
        </Link>
      )}
    </div>
  );
}