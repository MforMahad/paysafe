"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Plus,
  Building2,
  CreditCard,
  Link2,
  ArrowRight,
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
  integration_type: "hosted_page" | "payment_api";
  statement_descriptor: string | null;
  hosted_payment_url: string | null;
  is_active: boolean;
};

function formatIntegrationType(type: Merchant["integration_type"]) {
  if (type === "hosted_page") {
    return "Hosted Payment Page";
  }

  return "Payment API";
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMerchants() {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("merchants")
        .select(
          `
            id,
            name,
            integration_type,
            statement_descriptor,
            hosted_payment_url,
            is_active
          `
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Failed to load merchants:", fetchError);
        setError("Unable to load merchants.");
        setLoading(false);
        return;
      }

      setMerchants(data ?? []);
      setLoading(false);
    }

    loadMerchants();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Merchants
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Configure the payment destinations used by your payment links.
          </p>
        </div>

        <Link
          href="/dashboard/merchants/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Merchant</span>
        </Link>
      </div>

      {/* MERCHANTS TABLE CONTAINER */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading merchants...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : merchants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
                  <th className="py-3 px-6 font-semibold">Merchant</th>
                  <th className="py-3 px-6 font-semibold">Integration</th>
                  <th className="py-3 px-6 font-semibold">
                    Statement Descriptor
                  </th>
                  <th className="py-3 px-6 font-semibold">
                    Hosted Payment URL
                  </th>
                  <th className="py-3 px-6 font-semibold text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {merchants.map((merchant) => (
                  <tr
                    key={merchant.id}
                    className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#F5F7FB] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-[#64748B]" />
                        </div>

                        <span className="text-sm font-semibold text-[#0F172A]">
                          {merchant.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs text-[#475569]">
                        {formatIntegrationType(merchant.integration_type)}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs text-[#475569]">
                        {merchant.statement_descriptor || "—"}
                      </span>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      {merchant.hosted_payment_url ? (
                        <span
                          className="block truncate text-xs text-[#475569]"
                          title={merchant.hosted_payment_url}
                        >
                          {merchant.hosted_payment_url}
                        </span>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">—</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wide ${
                          merchant.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {merchant.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* EMPTY STATE WORKSPACE */
          <div className="p-8 sm:p-12 text-center">
            <div className="max-w-xl mx-auto space-y-6">
              {/* CONCEPTUAL WORKFLOW VISUAL */}
              <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>BUSINESS</span>
                </div>

                <ArrowRight className="w-3 h-3 text-slate-400" />

                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2563EB]">
                  <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>MERCHANT</span>
                </div>

                <ArrowRight className="w-3 h-3 text-slate-400" />

                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>PAYMENT LINK</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  No merchants configured
                </h2>

                <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
                  Add a merchant configuration before creating payment links.
                </p>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  href="/dashboard/merchants/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Merchant</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}