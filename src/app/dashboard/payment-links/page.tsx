// Server Component: reads as the signed-in user (RLS applies) and scopes rows
// to the user's active business. force-dynamic + revalidate = 0 guarantee this
// page always fetches fresh rows instead of the Next.js cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { PaymentLinksTableClient, type PaymentLink } from "./PaymentLinksTableClient";

// Row shape as returned by Supabase; status is unvalidated text and to-one
// relations may arrive as either an object or a single-item array.
type RawPaymentLink = Omit<PaymentLink, "status"> & { status: string };

export default async function PaymentLinksPage() {
  const supabase = await createClient();

  // Authorize here, next to the data: the dashboard layout's check does not
  // re-run on client navigation and does not stop this page from rendering.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Same business resolution as the dashboard layout.
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("Failed to load business membership:", membershipError);
    return (
      <PaymentLinksTableClient
        paymentLinks={[]}
        errorMessage="We couldn't load your business account. Please refresh and try again."
      />
    );
  }

  if (!membership?.business_id) {
    redirect("/onboarding/business");
  }

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
      paid_at,
      gateway_payment_id,
      expires_at,
      created_at,
      merchants (
        name
      ),
      brands (
        name,
        customer_facing_name
      )
    `)
    .eq("business_id", membership.business_id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load payment links:", error);
  }

  const rows = (data ?? []) as unknown as RawPaymentLink[];

  const paymentLinks: PaymentLink[] = rows.map((link) => {
    const isPaid = link.status === "paid" || Boolean(link.paid_at);
    return {
      id: link.id,
      description: link.description,
      amount: link.amount,
      currency: link.currency,
      customer_name: link.customer_name,
      customer_email: link.customer_email,
      status: isPaid
        ? "paid"
        : link.status === "failed"
          ? "failed"
          : link.status === "expired"
            ? "expired"
            : link.status === "cancelled"
              ? "cancelled"
              : "active",
      paid_at: link.paid_at ?? null,
      gateway_payment_id: link.gateway_payment_id ?? null,
      expires_at: link.expires_at,
      created_at: link.created_at,
      merchants: link.merchants ? (Array.isArray(link.merchants) ? link.merchants[0] : link.merchants) : null,
      brands: link.brands ? (Array.isArray(link.brands) ? link.brands[0] : link.brands) : null,
    };
  });

  return (
    <PaymentLinksTableClient
      paymentLinks={paymentLinks}
      errorMessage={error ? "We couldn't load your payment links. Please refresh and try again." : ""}
    />
  );
}
