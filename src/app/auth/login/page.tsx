"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        if (
          signInError.message.toLowerCase().includes("email not confirmed")
        ) {
          setError("Please confirm your email address before signing in.");
        } else {
          setError("Invalid email or password.");
        }

        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "Unable to establish your account session. Please try again."
        );
        setLoading(false);
        return;
      }

      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("id, business_id, role, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

      if (membershipError) {
        console.error("Membership lookup failed:", membershipError);
        setError("Unable to load your workspace. Please try again.");
        setLoading(false);
        return;
      }

      if (membership) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            last_accessed_business_id: membership.business_id,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Failed to update workspace:", updateError);
        }

        router.push("/dashboard");
        return;
      }

      router.push("/onboarding/business");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Sign in to PaySafe
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Access your payment operations workspace.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Email
          </label>

          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@company.com"
            autoComplete="email"
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-700">
              Password
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/auth/signup"
          className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Don't have an account? Create one
        </Link>
      </div>
    </div>
  );
}