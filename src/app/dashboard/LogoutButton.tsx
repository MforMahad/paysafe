"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setLoading(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-3 px-3 py-2 mt-3 rounded-md text-[10px] font-mono font-medium tracking-wide uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5 shrink-0" />
      <span>{loading ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}