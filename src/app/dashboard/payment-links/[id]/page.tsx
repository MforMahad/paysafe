import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Link2,
  User,
  Store,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PaymentLinkDetail = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  status: "active" | "expired" | "cancelled";
  link_token: string;
  expires_at: string;
  created_at: string;

  merchants:
    | {
        name: string;
        statement_descriptor: string | null;
        integration_type: string;
      }
    | {
        name: string;
        statement_descriptor: string | null;
        integration_type: string;
      }[]
    | null;

  brands:
    | {
        name: string;
        customer_facing_name: string | null;
        website: string | null;
      }
    | {
        name: string;
        customer_facing_name: string | null;
        website: string | null;
      }[]
    | null;
};

type PaymentLinkPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRelation<T>(
  relation: T | T[] | null
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function getDisplayStatus(
  status: PaymentLinkDetail["status"],
  expiresAt: string
) {
  if (
    status === "active" &&
    new Date(expiresAt).getTime() <= Date.now()
  ) {
    return "expired" as const;
  }

  return status;
}

function formatAmount(
  amount: number | string,
  currency: string
) {
  const numericAmount =
    typeof amount === "number"
      ? amount
      : Number(amount);

  return `${currency.toUpperCase()} ${numericAmount.toFixed(2)}`;
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

function getStatusClasses(
  status: "active" | "expired" | "cancelled"
) {
  if (status === "active") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "expired") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getStatusLabel(
  status: "active" | "expired" | "cancelled"
) {
  if (status === "active") {
    return "Active";
  }

  if (status === "expired") {
    return "Expired";
  }

  return "Cancelled";
}

export default async function PaymentLinkDetailPage({
  params,
}: PaymentLinkPageProps) {
  const { id } = await params;

  if (!id?.trim()) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_links")
    .select(`
      id,
      description,
      amount,
      currency,
      customer_name,
      customer_email,
      status,
      link_token,
      expires_at,
      created_at,
      merchants (
        name,
        statement_descriptor,
        integration_type
      ),
      brands (
        name,
        customer_facing_name,
        website
      )
    `)
    .eq("id", id.trim())
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load payment link:",
      error
    );

    notFound();
  }

  if (!data) {
    notFound();
  }

  const rawLink =
    data as unknown as PaymentLinkDetail;

  const merchant = normalizeRelation(
    rawLink.merchants
  );

  const brand = normalizeRelation(
    rawLink.brands
  );

  const displayStatus = getDisplayStatus(
    rawLink.status,
    rawLink.expires_at
  );

  /*
   * Build the public URL from the current request host.
   *
   * This keeps localhost working during development
   * and uses the production hostname when deployed.
   */
  const requestHeaders = await headers();

  const forwardedHost =
    requestHeaders.get("x-forwarded-host");

  const host =
    forwardedHost ||
    requestHeaders.get("host");

  const forwardedProto =
    requestHeaders.get("x-forwarded-proto");

  const protocol =
    forwardedProto ||
    (host?.includes("localhost")
      ? "http"
      : "https");

  const publicBaseUrl = host
    ? `${protocol}://${host}`
    : "https://paysafegateway.netlify.app";

  const publicUrl =
    `${publicBaseUrl}/pay/${rawLink.link_token}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-4 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/payment-links"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Payment Links</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {rawLink.description}
              </h1>

              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${getStatusClasses(
                  displayStatus
                )}`}
              >
                {getStatusLabel(displayStatus)}
              </span>
            </div>

            <p className="mt-1 text-sm text-[#64748B]">
              Payment link details and customer sharing.
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
              Amount
            </p>

            <p className="mt-1 text-xl font-bold font-mono text-[#0B132B]">
              {formatAmount(
                rawLink.amount,
                rawLink.currency
              )}
            </p>
          </div>
        </div>
      </div>

      {/* PUBLIC LINK */}
      <section className="bg-[#0B132B] rounded-lg p-6 sm:p-7 text-white">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-[#60A5FA]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Public Payment Link
            </p>

            <p className="mt-2 text-sm font-mono text-white break-all">
              {publicUrl}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Share this URL with the customer to open the
              hosted payment request.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-mono font-bold text-[#0B132B] hover:bg-slate-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-xs font-mono font-bold text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Payment Page
          </a>
        </div>
      </section>

      {/* DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CUSTOMER */}
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
            <User className="w-4 h-4 text-[#2563EB]" />

            <h2 className="text-sm font-bold text-[#0F172A]">
              Customer
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Name
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                {rawLink.customer_name ||
                  "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Email
              </p>

              <p className="mt-1 text-sm text-[#0F172A] break-all">
                {rawLink.customer_email ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </section>

        {/* MERCHANT */}
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
            <Store className="w-4 h-4 text-[#2563EB]" />

            <h2 className="text-sm font-bold text-[#0F172A]">
              Merchant
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Name
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                {merchant?.name ||
                  "Unknown merchant"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Integration
              </p>

              <p className="mt-1 text-sm text-[#0F172A]">
                {merchant?.integration_type ||
                  "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Statement Descriptor
              </p>

              <p className="mt-1 text-sm font-mono text-[#0F172A]">
                {merchant?.statement_descriptor ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </section>

        {/* BRAND */}
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
            <Briefcase className="w-4 h-4 text-[#2563EB]" />

            <h2 className="text-sm font-bold text-[#0F172A]">
              Brand
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Internal Name
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                {brand?.name ||
                  "Unknown brand"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Customer-Facing Name
              </p>

              <p className="mt-1 text-sm text-[#0F172A]">
                {brand?.customer_facing_name ||
                  brand?.name ||
                  "Not specified"}
              </p>
            </div>

            {brand?.website && (
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                  Website
                </p>

                <p className="mt-1 text-sm text-[#0F172A] break-all">
                  {brand.website}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* LINK INFORMATION */}
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
            <CalendarDays className="w-4 h-4 text-[#2563EB]" />

            <h2 className="text-sm font-bold text-[#0F172A]">
              Link Information
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Created
              </p>

              <p className="mt-1 text-sm text-[#0F172A]">
                {formatDateTime(
                  rawLink.created_at
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Expires
              </p>

              <p className="mt-1 text-sm text-[#0F172A]">
                {formatDateTime(
                  rawLink.expires_at
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B]">
                Link ID
              </p>

              <p className="mt-1 text-xs font-mono text-[#64748B] break-all">
                {rawLink.id}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}