"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Plus,
  Briefcase,
  Link2,
  User,
  ArrowRight,
  Globe,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
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

type Brand = {
  id: string;
  name: string;
  customer_facing_name: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  created_at: string;
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBrands() {
      setLoading(true);
      setLoadError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("brands")
        .select(
          `
            id,
            name,
            customer_facing_name,
            logo_url,
            contact_email,
            contact_phone,
            website,
            created_at
          `
        )
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Failed to load brands:", error);
        setLoadError(
          error.message || "Unable to load brands. Please try again."
        );
        setBrands([]);
        setLoading(false);
        return;
      }

      setBrands((data ?? []) as Brand[]);
      setLoading(false);
    }

    loadBrands();

    return () => {
      mounted = false;
    };
  }, []);

  const hasBrands = brands.length > 0;

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
            Brands
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Manage the business identities used across your payment links.
          </p>
        </div>

        <Link
          href="/dashboard/brands/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </Link>
      </div>

      {/* DATABASE ERROR */}
      {loadError && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <div className="space-y-1">
            <p className="text-xs font-medium">
              Unable to load brands
            </p>

            <p className="text-xs leading-relaxed">
              {loadError}
            </p>
          </div>
        </div>
      )}

      {/* BRAND WORKSPACE CONTAINER */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {/* TABLE HEADER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
                <th className="py-3 px-6 font-semibold">
                  Brand
                </th>

                <th className="py-3 px-6 font-semibold">
                  Customer-Facing Information
                </th>

                <th className="py-3 px-6 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {/* LOADING */}
            {loading && (
              <tbody>
                <tr>
                  <td colSpan={3}>
                    <div className="flex items-center justify-center gap-2 py-16 text-[#64748B]">
                      <Loader2 className="w-4 h-4 animate-spin" />

                      <span className="text-xs font-mono">
                        Loading brands...
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}

            {/* REAL BRANDS */}
            {!loading && hasBrands && (
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/40 transition-colors"
                  >
                    {/* BRAND */}
                    <td className="py-5 px-6 align-top">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="w-9 h-9 rounded-md border border-[#E2E8F0] bg-[#F5F7FB] flex items-center justify-center shrink-0 overflow-hidden">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Briefcase className="w-4 h-4 text-[#2563EB]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0F172A] truncate">
                            {brand.name}
                          </div>

                          <div className="text-[11px] text-[#64748B] font-mono mt-0.5 truncate">
                            {brand.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CUSTOMER-FACING INFORMATION */}
                    <td className="py-5 px-6 align-top">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-[#0F172A]">
                          {brand.customer_facing_name}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#64748B]">
                          {brand.contact_email && (
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[220px]">
                                {brand.contact_email}
                              </span>
                            </span>
                          )}

                          {brand.contact_phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>
                                {brand.contact_phone}
                              </span>
                            </span>
                          )}

                          {brand.website && (
                            <span className="inline-flex items-center gap-1.5">
                              <Globe className="w-3 h-3 shrink-0" />

                              <span className="truncate max-w-[220px]">
                                {brand.website}
                              </span>
                            </span>
                          )}
                        </div>

                        {!brand.contact_email &&
                          !brand.contact_phone &&
                          !brand.website && (
                            <span className="text-[11px] text-[#94A3B8]">
                              No additional contact information
                            </span>
                          )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-5 px-6 align-top text-right">
                      <span className="text-[11px] font-mono text-[#94A3B8]">
                        —
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* EMPTY STATE */}
        {!loading && !hasBrands && !loadError && (
          <div className="p-8 sm:p-12 text-center border-t border-[#E2E8F0]/40">
            <div className="max-w-xl mx-auto space-y-6">
              {/* CONCEPTUAL WORKFLOW VISUAL */}
              <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2563EB]">
                  <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>BRAND IDENTITY</span>
                </div>

                <ArrowRight className="w-3 h-3 text-slate-400" />

                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>PAYMENT LINK</span>
                </div>

                <ArrowRight className="w-3 h-3 text-slate-400" />

                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>CUSTOMER</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  No brands configured
                </h2>

                <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
                  Add a brand to define the customer-facing identity used by
                  your payment links.
                </p>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Link
                  href="/dashboard/brands/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Brand</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}