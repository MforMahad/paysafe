"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Globe,
  Key,
  Sliders,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

type IntegrationType = "Hosted Payment Page" | "Payment API";

export default function CreateMerchantPage() {
  const router = useRouter();

  const [merchantName, setMerchantName] = useState("");
  const [statementDescriptor, setStatementDescriptor] = useState("");
  const [integrationType, setIntegrationType] = useState<IntegrationType>(
    "Hosted Payment Page",
  );

  const [hostedPaymentUrl, setHostedPaymentUrl] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showApiSecret, setShowApiSecret] = useState(false);

  const [paramAmount, setParamAmount] = useState("amount");
  const [paramCurrency, setParamCurrency] = useState("currency");
  const [paramReference, setParamReference] = useState("reference");
  const [paramCallbackUrl, setParamCallbackUrl] = useState("callback_url");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isHostedPage = integrationType === "Hosted Payment Page";

  const hasRequiredBaseFields =
    merchantName.trim() !== "" &&
    statementDescriptor.trim() !== "" &&
    integrationType.trim() !== "";

  const isValid =
    hasRequiredBaseFields &&
    (isHostedPage
      ? hostedPaymentUrl.trim() !== "" &&
        paramAmount.trim() !== "" &&
        paramCurrency.trim() !== "" &&
        paramReference.trim() !== "" &&
        paramCallbackUrl.trim() !== ""
      : providerCode.trim() !== "" &&
        apiBaseUrl.trim() !== "" &&
        apiSecret.trim() !== "");

  const getCredentialsStatusText = () => {
    const hasKey = apiKey.trim() !== "";
    const hasSecret = apiSecret.trim() !== "";

    if (hasKey && hasSecret) {
      return "API key & secret provided";
    }

    if (hasKey) {
      return "API key provided";
    }

    if (hasSecret) {
      return "API secret provided";
    }

    return "Not configured";
  };

  async function handleSaveMerchant() {
    if (!isValid || saving) return;

    setSaving(true);
    setSaveError("");

    try {
      const supabase = createClient();

      const databaseIntegrationType =
        integrationType === "Hosted Payment Page"
          ? "hosted_page"
          : "payment_api";

      const { data: merchant, error } = await supabase.rpc("create_merchant", {
        p_name: merchantName.trim(),
        p_statement_descriptor: statementDescriptor.trim(),
        p_integration_type: databaseIntegrationType,
        p_hosted_payment_url: hostedPaymentUrl.trim() || null,
        p_amount_parameter: paramAmount.trim() || null,
        p_currency_parameter: paramCurrency.trim() || null,
        p_reference_parameter: paramReference.trim() || null,
        p_callback_url_parameter: paramCallbackUrl.trim() || null,
      });

      if (error) {
        console.error("Failed to create merchant:", error);

        setSaveError(
          error.message || "Unable to create merchant. Please try again.",
        );

        setSaving(false);
        return;
      }

      if (!merchant?.id) {
        throw new Error(
          "Merchant was created but no merchant ID was returned.",
        );
      }

      if (databaseIntegrationType === "payment_api") {
        const configurationResponse = await fetch(
          "/api/dashboard/merchants/configuration",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              merchantId: merchant.id,
              providerCode: providerCode.trim(),
              apiBaseUrl: apiBaseUrl.trim(),
              apiKey: apiKey.trim() || null,
              apiSecret: apiSecret.trim() || null,
            }),
          },
        );

        const configurationResult = await configurationResponse.json();

        if (!configurationResponse.ok) {
          throw new Error(
            configurationResult.error ||
              "Merchant was created, but API configuration could not be saved.",
          );
        }
      }

      router.push("/dashboard/merchants");
      router.refresh();
    } catch (error) {
      console.error("Failed to save merchant:", error);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save merchant. Please try again.",
      );

      setSaving(false);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* PAGE HEADER */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/merchants"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Merchants</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Add Merchant
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Configure a payment destination for use with your PaySafe payment
            links.
          </p>
        </div>
      </div>

      {/* TWO-COLUMN CONFIGURATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-lg">
          {/* SECTION 1 — MERCHANT DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Merchant Details
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Merchant Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Merchant name"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Statement Descriptor <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={statementDescriptor}
                onChange={(e) => setStatementDescriptor(e.target.value)}
                placeholder="Statement shown to customers"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />

              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                Use the descriptor customers should recognize when reviewing a
                payment.
              </p>
            </div>
          </div>

          {/* SECTION 2 — INTEGRATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Globe className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Integration
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Integration Type <span className="text-red-500">*</span>
              </label>

              <select
                value={integrationType}
                onChange={(e) =>
                  setIntegrationType(e.target.value as IntegrationType)
                }
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              >
                <option value="Hosted Payment Page">Hosted Payment Page</option>
                <option value="Payment API">Payment API</option>
              </select>

              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                Choose how PaySafe will hand off or submit payment requests.
              </p>
            </div>

            {isHostedPage ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Hosted Payment URL <span className="text-red-500">*</span>
                </label>

                <input
                  type="url"
                  value={hostedPaymentUrl}
                  onChange={(e) => setHostedPaymentUrl(e.target.value)}
                  placeholder="https://example.com/pay"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />

                <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                  The URL PaySafe will use when routing a payment request.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-[#0F172A]">
                    Provider Code <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={providerCode}
                    onChange={(e) => setProviderCode(e.target.value)}
                    placeholder="mockgateway"
                    autoComplete="off"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />

                  <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                    Internal provider identifier used by the PaySafe payment
                    engine.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-[#0F172A]">
                    API Base URL <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="url"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://provider.example.com/api"
                    autoComplete="url"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />

                  <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                    HTTPS API endpoint used by PaySafe to initiate payments.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* SECTION 3 — CREDENTIALS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Key className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  API Key
                </label>

                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  autoComplete="off"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                {!isHostedPage && <span className="text-red-500">*</span>}
                </label>

                <div className="relative">
                  <input
                    type={showApiSecret ? "text" : "password"}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter API secret"
                    autoComplete="new-password"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md pl-3 pr-9 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] transition-colors"
                    aria-label={
                      showApiSecret ? "Hide API secret" : "Show API secret"
                    }
                  >
                    {showApiSecret ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#64748B]">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Credentials are encrypted before being stored securely.
              </span>
            </div>
          </div>

          {/* SECTION 4 — PAYMENT URL PARAMETERS */}
          {isHostedPage && (

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment URL Parameters
              </h2>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed">
              Map PaySafe payment fields to the parameter names expected by the
              configured payment destination.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Amount
                </span>

                <input
                  type="text"
                  value={paramAmount}
                  onChange={(e) => setParamAmount(e.target.value)}
                  placeholder="amount"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Currency
                </span>

                <input
                  type="text"
                  value={paramCurrency}
                  onChange={(e) => setParamCurrency(e.target.value)}
                  placeholder="currency"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Reference
                </span>

                <input
                  type="text"
                  value={paramReference}
                  onChange={(e) => setParamReference(e.target.value)}
                  placeholder="reference"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Callback URL
                </span>

                <input
                  type="text"
                  value={paramCallbackUrl}
                  onChange={(e) => setParamCallbackUrl(e.target.value)}
                  placeholder="callback_url"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

        )}


          {/* ERROR */}
          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{saveError}</p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              href="/dashboard/merchants"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={!isValid || saving}
              onClick={handleSaveMerchant}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                isValid && !saving
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving..." : "Save Merchant"}
            </button>
          </div>
        </div>

        {/* RIGHT SUMMARY COLUMN */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Merchant Configuration
              </h3>

              <div>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    READY TO SAVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <AlertCircle className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                  Merchant
                </span>

                <div className="text-lg font-bold font-mono text-[#0F172A] truncate">
                  {merchantName || "—"}
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Descriptor</span>

                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {statementDescriptor || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Integration</span>

                  <span className="text-[#0F172A] font-medium text-right">
                    {integrationType || "—"}
                  </span>
                </div>

                {isHostedPage ? (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#64748B]">Hosted Payment URL</span>

                    <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                      {hostedPaymentUrl || "—"}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#64748B]">Provider</span>

                      <span className="text-[#0F172A] font-medium text-right">
                        {providerCode || "—"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#64748B]">API Base URL</span>

                      <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                        {apiBaseUrl || "—"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Credentials</span>

                  <span className="text-[#0F172A] font-medium text-right">
                    {getCredentialsStatusText()}
                  </span>
                </div>

                {isHostedPage && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#64748B]">URL Parameters</span>

                    <span className="text-[#0F172A] font-medium text-right">
                      4 configured
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed text-center">
              Merchant configuration and API credentials are securely stored in
              your PaySafe workspace.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
