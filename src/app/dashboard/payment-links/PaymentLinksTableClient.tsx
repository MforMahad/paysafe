"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Link2,
  Plus,
  Search,
  SearchX,
  User,
  X,
  XCircle,
} from "lucide-react";

export type StatusFilter = "All" | "Active" | "Paid" | "Expired" | "Cancelled";

type DisplayStatus = "active" | "paid" | "expired" | "cancelled" | "failed";

export type PaymentLink = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  status: DisplayStatus;
  paid_at?: string | null;
  gateway_payment_id?: string | null;
  expires_at: string;
  created_at: string;
  merchants: { name: string } | { name: string }[] | null;
  brands:
    | { name: string; customer_facing_name: string | null }
    | { name: string; customer_facing_name: string | null }[]
    | null;
};

type Props = {
  paymentLinks: PaymentLink[];
  errorMessage?: string;
  initialFilter?: StatusFilter;
};

const STATUS_FILTERS: readonly StatusFilter[] = ["All", "Active", "Paid", "Expired", "Cancelled"];

const STATUS_BADGES: Record<
  DisplayStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> | null }
> = {
  paid: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  },
  active: {
    label: "Active",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    Icon: null,
  },
  expired: {
    label: "Expired",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    Icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    Icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    Icon: XCircle,
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// Fixed locale + time zone so server-rendered and hydrated markup always match.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function getDisplayStatus(link: PaymentLink, now: number): DisplayStatus {
  // A recorded payment always wins, even if the status column lags behind.
  if (link.status === "paid" || Boolean(link.paid_at)) {
    return "paid";
  }

  if (link.status === "failed") {
    return "failed";
  }

  if (link.status === "cancelled") {
    return "cancelled";
  }

  if (link.status === "expired") {
    return "expired";
  }

  const expiresAt = new Date(link.expires_at).getTime();

  if (!Number.isNaN(expiresAt) && expiresAt <= now) {
    return "expired";
  }

  return "active";
}

function formatAmount(amount: number | string, currency: string): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  const code = (currency || "").toUpperCase();

  if (!Number.isFinite(value)) {
    return `${amount} ${code}`.trim();
  }

  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`.trim();
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const { label, className, Icon } = STATUS_BADGES[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function NoPaymentLinksState() {
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
          <h2 className="text-xl font-bold text-[#0F172A]">No payment links yet</h2>

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
}

function NoMatchesState({
  filter,
  query,
  onReset,
}: {
  filter: StatusFilter;
  query: string;
  onReset: () => void;
}) {
  const statusLabel = filter === "All" ? "" : `${filter.toLowerCase()} `;

  return (
    <div className="p-8 sm:p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F5F7FB] border border-[#E2E8F0]">
          <SearchX className="w-4 h-4 text-slate-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#0F172A]">No {statusLabel}payment links found</h2>

          <p className="text-sm text-[#64748B] leading-relaxed">
            {query
              ? `Nothing matches "${query}". Try a different search term or status filter.`
              : `You don't have any ${statusLabel}payment links right now.`}
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear Filters</span>
        </button>
      </div>
    </div>
  );
}

export function PaymentLinksTableClient({
  paymentLinks,
  errorMessage = "",
  initialFilter = "All",
}: Props) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  // Captured once per mount so expiry evaluation is stable across re-renders.
  const [now] = useState(() => Date.now());

  const linksWithStatus = useMemo(
    () =>
      paymentLinks.map((link) => ({
        link,
        displayStatus: getDisplayStatus(link, now),
        merchant: normalizeRelation(link.merchants),
        brand: normalizeRelation(link.brands),
      })),
    [paymentLinks, now]
  );

  const filterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      All: linksWithStatus.length,
      Active: 0,
      Paid: 0,
      Expired: 0,
      Cancelled: 0,
    };

    for (const { displayStatus } of linksWithStatus) {
      if (displayStatus === "active") counts.Active += 1;
      else if (displayStatus === "paid") counts.Paid += 1;
      else if (displayStatus === "expired") counts.Expired += 1;
      else if (displayStatus === "cancelled") counts.Cancelled += 1;
    }

    return counts;
  }, [linksWithStatus]);

  const trimmedQuery = searchQuery.trim();

  const filteredLinks = useMemo(() => {
    const query = trimmedQuery.toLowerCase();

    return linksWithStatus.filter(({ link, displayStatus, merchant, brand }) => {
      if (activeFilter !== "All" && displayStatus !== activeFilter.toLowerCase()) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        link.id,
        link.description,
        link.customer_name,
        link.customer_email,
        link.currency,
        String(link.amount),
        link.gateway_payment_id,
        merchant?.name,
        brand?.name,
        brand?.customer_facing_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [linksWithStatus, activeFilter, trimmedQuery]);

  const resetFilters = () => {
    setActiveFilter("All");
    setSearchQuery("");
  };

  const renderBody = () => {
    if (errorMessage) {
      return (
        <div role="alert" className="p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>

            <h2 className="text-lg font-bold text-[#0F172A]">Unable to load payment links</h2>

            <p className="text-sm text-[#64748B] leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      );
    }

    if (paymentLinks.length === 0) {
      return <NoPaymentLinksState />;
    }

    if (filteredLinks.length === 0) {
      return <NoMatchesState filter={activeFilter} query={trimmedQuery} onReset={resetFilters} />;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm text-left text-[#64748B]">
          <thead className="border-b border-[#E2E8F0] bg-slate-50 text-[10px] uppercase tracking-wider text-[#9CA3AF]">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">Description</th>
              <th scope="col" className="px-6 py-3 font-medium">Customer</th>
              <th scope="col" className="px-6 py-3 font-medium">Status</th>
              <th scope="col" className="px-6 py-3 font-medium">Amount</th>
              <th scope="col" className="px-6 py-3 font-medium">Expires</th>
              <th scope="col" className="px-6 py-3 font-medium text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredLinks.map(({ link, displayStatus, merchant, brand }) => {
              const brandName = brand?.customer_facing_name || brand?.name || merchant?.name;

              return (
                <tr
                  key={link.id}
                  className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div
                      className="text-xs font-mono font-medium text-[#0F172A] max-w-[240px] truncate"
                      title={link.description}
                    >
                      {link.description || "Untitled payment link"}
                    </div>
                    {brandName && (
                      <div className="mt-0.5 text-[11px] text-[#9CA3AF] max-w-[240px] truncate">
                        {brandName}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs">
                    {link.customer_name ? (
                      <>
                        <div className="text-[#0F172A]">{link.customer_name}</div>
                        {link.customer_email && (
                          <div className="mt-0.5 text-[11px] text-[#9CA3AF]">{link.customer_email}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-[#64748B]">{link.customer_email || "—"}</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={displayStatus} />
                    {displayStatus === "paid" && link.paid_at && (
                      <div className="mt-1 text-[10px] font-mono text-[#9CA3AF]">
                        {formatDate(link.paid_at)}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs font-mono text-[#0F172A] whitespace-nowrap">
                    {formatAmount(link.amount, link.currency)}
                  </td>

                  <td className="px-6 py-4 text-xs font-mono text-[#64748B] whitespace-nowrap">
                    {formatDate(link.expires_at)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/payment-links/${link.id}`}
                      className="text-xs font-mono font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Payment Links</h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">Create and manage payment requests.</p>
        </div>

        <Link
          href="/dashboard/payment-links/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment Link</span>
        </Link>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment links..."
            aria-label="Search payment links"
            disabled={Boolean(errorMessage)}
            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-10 pr-9 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Filter payment links by status"
          className="flex items-center gap-1 overflow-x-auto scrollbar-none border border-[#E2E8F0] bg-white p-1 rounded-lg shrink-0"
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive ? "bg-[#0B132B] text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                {filter}
                <span
                  className={`rounded px-1.5 text-[10px] ${
                    isActive ? "bg-white/15 text-white" : "bg-slate-100 text-[#64748B]"
                  }`}
                >
                  {filterCounts[filter]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">{renderBody()}</div>
    </motion.div>
  );
}
