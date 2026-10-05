"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlugChange = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(normalized);
  };

  const isValid =
    legalName.trim().length > 0 &&
    displayName.trim().length > 0 &&
    slug.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid || loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Your session could not be verified. Please sign in again.");
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "create_initial_business",
        {
          p_legal_name: legalName.trim(),
          p_display_name: displayName.trim(),
          p_slug: slug.trim().toLowerCase(),
        }
      );

      if (rpcError) {
        console.error("Business creation failed:", rpcError);

        if (
          rpcError.message
            .toLowerCase()
            .includes("already belongs to an active business")
        ) {
          setError("You already belong to an active business.");
        } else if (
          rpcError.message.toLowerCase().includes("duplicate")
        ) {
          setError(
            "That workspace slug is already in use. Please choose another."
          );
        } else {
          setError(
            "We couldn't create your workspace. Please check your information and try again."
          );
        }

        setLoading(false);
        return;
      }

      if (!data) {
        setError("We couldn't create your workspace. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Business onboarding error:", err);

      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="h-1.5 w-8 rounded-full bg-blue-600" />
        <div className="h-1.5 w-8 rounded-full bg-slate-200" />
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Set up your business
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Create your PaySafe workspace to start managing payment operations.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-5">
          {/* Legal Name */}
          <div>
            <label
              htmlFor="legal-name"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Legal business name
            </label>

            <input
              id="legal-name"
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Your registered business name"
              disabled={loading}
              autoComplete="organization"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="display-name"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Display name
            </label>

            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your business appears in PaySafe"
              disabled={loading}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* Workspace Slug */}
          <div>
            <label
              htmlFor="workspace-slug"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Workspace slug
            </label>

            <div className="flex h-11 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
              <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
                paysafe/
              </span>

              <input
                id="workspace-slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-business"
                disabled={loading}
                autoComplete="off"
                className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              This will identify your PaySafe workspace.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating workspace...
            </>
          ) : (
            <>
              Create workspace
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-400">
        You can configure your payment settings after setup.
      </p>
    </div>
  );
}