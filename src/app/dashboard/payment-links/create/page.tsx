"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Store,
  Briefcase,
  Clock,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
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

type Merchant = {
  id: string;
  name: string;
  integration_type: string;
  statement_descriptor: string;
};

type Brand = {
  id: string;
  name: string;
  customer_facing_name: string;
};

const expirationOptions = [
  {
    label: "24 hours",
    hours: 24,
  },
  {
    label: "3 days",
    hours: 72,
  },
  {
    label: "7 days",
    hours: 168,
  },
  {
    label: "30 days",
    hours: 720,
  },
];

export default function CreatePaymentLinkPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [merchant, setMerchant] = useState("");
  const [brand, setBrand] = useState("");

  const [expiration, setExpiration] = useState("24 hours");

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isValid =
    amount.trim() !== "" &&
    parseFloat(amount) > 0 &&
    currency.trim() !== "" &&
    description.trim() !== "" &&
    merchant.trim() !== "" &&
    brand.trim() !== "";

  useEffect(() => {
    let mounted = true;

    async function loadConfiguration() {
      setLoadingOptions(true);
      setOptionsError("");

      const supabase = createClient();

      const [
        { data: merchantData, error: merchantError },
        { data: brandData, error: brandError },
      ] = await Promise.all([
        supabase
          .from("merchants")
          .select(
            `
              id,
              name,
              integration_type,
              statement_descriptor
            `
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("brands")
          .select(
            `
              id,
              name,
              customer_facing_name
            `
          )
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (merchantError) {
        console.error("Failed to load merchants:", merchantError);
        setOptionsError(
          merchantError.message || "Unable to load merchants."
        );
        setLoadingOptions(false);
        return;
      }

      if (brandError) {
        console.error("Failed to load brands:", brandError);
        setOptionsError(
          brandError.message || "Unable to load brands."
        );
        setLoadingOptions(false);
        return;
      }

      const loadedMerchants = (merchantData ?? []) as Merchant[];
      const loadedBrands = (brandData ?? []) as Brand[];

      setMerchants(loadedMerchants);
      setBrands(loadedBrands);

      if (loadedMerchants.length > 0) {
        setMerchant(loadedMerchants[0].id);
      }

      if (loadedBrands.length > 0) {
        setBrand(loadedBrands[0].id);
      }

      setLoadingOptions(false);
    }

    loadConfiguration();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleGeneratePaymentLink() {
    if (!isValid || saving) return;

    setSaving(true);
    setSaveError("");

    const selectedExpiration = expirationOptions.find(
      (option) => option.label === expiration
    );

    if (!selectedExpiration) {
      setSaveError("Invalid expiration period.");
      setSaving(false);
      return;
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSaveError("Enter a valid amount greater than zero.");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc("create_payment_link", {
      p_merchant_id: merchant,
      p_brand_id: brand,
      p_description: description.trim(),
      p_amount: parsedAmount,
      p_currency: currency.trim().toUpperCase(),
      p_customer_name: customerName.trim() || null,
      p_customer_email: customerEmail.trim() || null,
      p_expiration_hours: selectedExpiration.hours,
    });

    if (error) {
      console.error("Failed to create payment link:", error);

      setSaveError(
        error.message || "Unable to create payment link. Please try again."
      );

      setSaving(false);
      return;
    }

    router.push("/dashboard/payment-links");
    router.refresh();
  }

  const selectedMerchant = merchants.find(
    (item) => item.id === merchant
  );

  const selectedBrand = brands.find(
    (item) => item.id === brand
  );

  const merchantUnavailable =
    !loadingOptions && merchants.length === 0;

  const brandUnavailable =
    !loadingOptions && brands.length === 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* HEADER SECTION */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/payment-links"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Payment Links</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Create Payment Link
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Create a payment request and configure how the customer will pay.
          </p>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-lg">
          {/* SECTION 1 — PAYMENT DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Amount <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Currency <span className="text-red-500">*</span>
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="PKR">PKR (Rs)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Reference / Description{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website development"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* SECTION 2 — CUSTOMER */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <User className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Customer
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Customer Email
                </label>

                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3 — PAYMENT CONFIGURATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Building2 className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Configuration
              </h2>
            </div>

            {optionsError && (
              <div className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                <p className="text-xs leading-relaxed">
                  {optionsError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MERCHANT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Merchant <span className="text-red-500">*</span>
                </label>

                <select
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  disabled={loadingOptions || merchantUnavailable}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {loadingOptions ? (
                    <option value="">Loading merchants...</option>
                  ) : merchants.length === 0 ? (
                    <option value="">No merchants configured</option>
                  ) : (
                    <>
                      <option value="">Select merchant</option>

                      {merchants.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* BRAND */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Brand <span className="text-red-500">*</span>
                </label>

                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={loadingOptions || brandUnavailable}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {loadingOptions ? (
                    <option value="">Loading brands...</option>
                  ) : brands.length === 0 ? (
                    <option value="">No brands configured</option>
                  ) : (
                    <>
                      <option value="">Select brand</option>

                      {brands.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Expiration
              </label>

              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              >
                {expirationOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ERROR */}
          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <p className="text-xs leading-relaxed">
                {saveError}
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              href="/dashboard/payment-links"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={!isValid || saving || loadingOptions}
              onClick={handleGeneratePaymentLink}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                isValid && !saving && !loadingOptions
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {saving && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}

              {saving ? "Generating..." : "Generate Payment Link"}
            </button>
          </div>
        </div>

        {/* RIGHT PREVIEW COLUMN */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Link Preview
              </h3>

              <div className="flex items-center gap-1.5">
                {isValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    READY TO GENERATE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <AlertCircle className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
              </div>
            </div>

            {loadingOptions && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading payment configuration...
              </div>
            )}

            {!amount && !description ? (
              <p className="text-xs text-[#64748B] font-normal leading-relaxed text-center py-6">
                Complete the payment details to preview the request.
              </p>
            ) : null}

            {/* CONCEPTUAL PREVIEW CARD */}
            <div className="bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                  Amount Requested
                </span>

                <div className="text-2xl font-bold font-mono text-[#0F172A]">
                  {amount ? `${currency} ${amount}` : "—"}
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Description</span>

                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {description || "—"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Customer</span>

                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {customerName || customerEmail || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Merchant</span>

                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {selectedMerchant?.name || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Brand</span>

                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {selectedBrand?.name || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Expiration</span>

                  <span className="text-[#0F172A] font-medium text-right flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {expiration}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed text-center">
              The preview reflects local inputs only. The payment link is
              generated when you submit the request.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}