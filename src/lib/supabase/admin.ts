import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * DANGER: bypasses Row Level Security entirely.
 * Server-only. Never import this in a Client Component
 * or anything that ships to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
