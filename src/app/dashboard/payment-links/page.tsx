"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Plus,
  Search,
  Building2,
  Link2,
  User,
  HelpCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const statusFilters = ["All", "Active", "Expired", "Cancelled"] as const;

type StatusFilter = (typeof statusFilters)[number];

type PaymentLink = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  status: "active" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  merchants: {
    name: string;
  } | null;
  brands: {
    name: string;
    customer_facing_name: string | null;
  } | null;
};

type RawPaymentLink = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  merchants:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  brands:
    | {
        name: string;
        customer_facing_name: string | null;
      }
    | {
        name: string;
        customer_facing_name: string | null;
      }[]
    | null;
};

function getDisplayStatus(link: PaymentLink) {
  if (
    link.status === "active" &&
    new Date(link.expires_at).getTime() <= Date.now()
  ) {
    return "expired" as const;
  }

  return link.status;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amount: number | string, currency: string) {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  return `${currency.toUpperCase()} ${numericAmount.toFixed(2)}`;
}

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export default function PaymentLinksPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  useEffect(() => {
    async function loadPaymentLinks() {
      setLoading(true);
      setErrorMessage("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("payment_links")
        .select(
          `
          id,
          description,
          amount,
          currency,
          customer_name,
          customer_email,
          status,
          expires_at,
          created_at,
          merchants (
            name
          ),
          brands (
            name,
            customer_facing_name
          )
        `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Failed to load payment links:", error);

        setErrorMessage(error.message || "Failed to load payment links.");

        setPaymentLinks([]);
        setLoading(false);

        return;
      }

      /*
       * Supabase relationship results can be represented
       * as either an object or an array depending on the
       * generated/inferred relationship type.
       *
       * Normalize them into the shape our UI expects.
       */
      const rows = (data ?? []) as unknown as RawPaymentLink[];

      const normalizedLinks: PaymentLink[] = rows.map((link) => ({
        id: link.id,
        description: link.description,
        amount: link.amount,
        currency: link.currency,
        customer_name: link.customer_name,
        customer_email: link.customer_email,
        status:
          link.status === "expired"
            ? "expired"
            : link.status === "cancelled"
              ? "cancelled"
              : "active",
        expires_at: link.expires_at,
        created_at: link.created_at,
        merchants: normalizeRelation(link.merchants),
        brands: normalizeRelation(link.brands),
      }));

      setPaymentLinks(normalizedLinks);
      setLoading(false);
    }

    loadPaymentLinks();
  }, []);

  const filteredPaymentLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return paymentLinks.filter((link) => {
      const displayStatus = getDisplayStatus(link);

      const matchesFilter =
        activeFilter === "All" || displayStatus === activeFilter.toLowerCase();

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        link.description,
        link.customer_name,
        link.customer_email,
        link.currency,
        link.merchants?.name,
        link.brands?.name,
        link.brands?.customer_facing_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [paymentLinks, activeFilter, searchQuery]);

  const renderStatus = (link: PaymentLink) => {
    const status = getDisplayStatus(link);

    if (status === "active") {
      return (
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">
          Active
        </span>
      );
    }

    if (status === "expired") {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
        Cancelled
      </span>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="p-8 sm:p-12 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>REQUEST</span>
            </div>

            <ArrowRight className="w-3 h-3 text-slate-400" />

            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2563EB]">
              <Link2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>LINK</span>
            </div>

            <ArrowRight className="w-3 h-3 text-slate-400" />

            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>CUSTOMER</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F172A]">
              No payment links yet
            </h2>

            <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
              Create a payment link to send a payment request to a customer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/payment-links/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Payment Link</span>
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Learn How It Works</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2563EB]" />

          <p className="mt-3 text-sm text-[#64748B]">
            Loading payment links...
          </p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">
              Unable to load payment links
            </h2>

            <p className="text-sm text-[#64748B] leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>
      );
    }

    if (paymentLinks.length === 0) {
      return renderEmptyState();
    }

    if (filteredPaymentLinks.length === 0) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-lg font-bold text-[#0F172A]">
            No matching payment links
          </h2>

          <p className="mt-2 text-sm text-[#64748B]">
            Try changing the search or status filter.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
              <th className="py-3 px-6 font-semibold">Payment Request</th>

              <th className="py-3 px-6 font-semibold">Amount</th>

              <th className="py-3 px-6 font-semibold">Status</th>

              <th className="py-3 px-6 font-semibold">Created</th>

              <th className="py-3 px-6 font-semibold">Expiration</th>

              <th className="py-3 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPaymentLinks.map((link) => (
              <tr
                key={link.id}
                className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="min-w-[220px]">
                    <div className="text-sm font-semibold text-[#0F172A]">
                      {link.description}
                    </div>

                    <div className="mt-1 text-[11px] font-mono text-[#64748B]">
                      {link.customer_name ||
                        link.customer_email ||
                        "No customer specified"}
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6">
                  <div className="text-sm font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                    {formatAmount(link.amount, link.currency)}
                  </div>
                </td>

                <td className="py-4 px-6">{renderStatus(link)}</td>

                <td className="py-4 px-6">
                  <div className="text-xs text-[#64748B] whitespace-nowrap">
                    {formatDate(link.created_at)}
                  </div>
                </td>

                <td className="py-4 px-6">
                  <div className="text-xs text-[#64748B] whitespace-nowrap">
                    {formatDateTime(link.expires_at)}
                  </div>
                </td>

                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/dashboard/payment-links/${link.id}`}
                    className="text-xs font-mono font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Payment Links
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Create and manage payment requests.
          </p>
        </div>

        <Link
          href="/dashboard/payment-links/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment Link</span>
        </Link>
      </div>

      {/* WORKSPACE TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment links..."
            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-10 pr-4 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
          />
        </div>

        {/* Status filter controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none border border-[#E2E8F0] bg-white p-1 rounded-lg shrink-0">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? "bg-[#0B132B] text-white"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* PAYMENT LINKS TABLE CONTAINER */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {renderContent()}
      </div>
    </motion.div>
  );
}
