// Server Component: reads the database directly and bypasses RLS when using the
// service-role key. force-dynamic + revalidate = 0 guarantee this page always
// fetches fresh rows instead of the Next.js cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from "react";
import { createClient } from "@supabase/supabase-js";

import { PaymentLinksTableClient, type PaymentLink } from "./PaymentLinksTableClient";

// Row shape as returned by Supabase; status is unvalidated text and to-one
// relations may arrive as either an object or a single-item array.
type RawPaymentLink = Omit<PaymentLink, "status"> & { status: string };

export default async function PaymentLinksPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
      errorMessage={error?.message || ""}
    />
  );
}
