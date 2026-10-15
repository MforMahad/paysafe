import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for trusted server-side writes (RLS bypass).
 *
 * Deliberately NOT built with @supabase/ssr + request cookies: when a browser
 * carries a Supabase auth cookie (e.g. a merchant testing checkout while logged
 * in to the dashboard), the SSR client sends that user's JWT instead of the
 * service-role key, so writes run under RLS and silently match zero rows.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
