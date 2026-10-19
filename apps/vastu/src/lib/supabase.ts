import "server-only";
import { createSupabaseClient } from "@astrokraft/db";

/** Anon client for public reads (RLS applies), e.g. approved AstroKraft reviews. Null when unconfigured. */
export function getSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createSupabaseClient(url, key) : null;
}

/** Service-role client (bypasses RLS). Server-only: API routes and webhooks. */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createSupabaseClient(url, key);
}
