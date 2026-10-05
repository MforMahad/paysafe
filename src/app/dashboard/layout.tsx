import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./DashboardShell";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No authenticated session
  if (!user) {
    redirect("/auth/login");
  }

  // Find the user's active business membership.
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select(
      `
        business_id,
        role,
        status,
        businesses (
          id,
          legal_name,
          display_name,
          slug
        )
      `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("Failed to load business membership:", membershipError);
    redirect("/auth/login");
  }

  // Authenticated user but no active business membership.
  if (!membership) {
    redirect("/onboarding/business");
  }

  const business = Array.isArray(membership.businesses)
    ? membership.businesses[0]
    : membership.businesses;

  if (!business) {
    redirect("/onboarding/business");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  const displayName =
    fullName ||
    (typeof user.email === "string" ? user.email.split("@")[0] : "User");

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DashboardShell
      user={{
        name: displayName,
        email: user.email ?? "",
        initials: initials || "U",
      }}
      business={{
        name: business.display_name,
        role: membership.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}