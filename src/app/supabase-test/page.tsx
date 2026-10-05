"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";


export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("businesses")
        .select("id")
        .limit(1);

      if (error) {
        setStatus(`Connected, but database query returned: ${error.message}`);
        return;
      }

      setStatus("Supabase connection successful.");
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Supabase Connection
        </h1>

        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </div>
    </main>
  );
}