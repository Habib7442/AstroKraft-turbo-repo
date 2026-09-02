import { createSupabaseClient } from "@astrokraft/db";

export function getSupabaseClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Service-role client that bypasses RLS. Server-only — never import this into
 * client components. Used by webhook handlers that need to write rows (e.g.
 * `profiles`) with no RLS policy permitting the action for a normal user.
 */
export function getSupabaseAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
