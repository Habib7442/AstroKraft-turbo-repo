import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// Webhooks are asynchronous and eventually consistent — the Clerk
// user.created webhook (api/webhooks/clerk) is the primary way profiles
// rows get created, but nothing guarantees it has landed (or even fired —
// e.g. a webhook endpoint misconfiguration in the Clerk Dashboard) by the
// time a brand-new user reaches checkout. orders.user_id and
// consultations.user_id both have a FK to profiles(id), so a missing row
// hard-fails the purchase with a foreign key violation. Call this before
// inserting an order/consultation so the synchronous checkout path never
// depends on webhook delivery timing.
export async function ensureProfile(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const role = user?.publicMetadata?.role === "admin" ? "admin" : "customer";

  const { error } = await supabase.from("profiles").upsert({ id: userId, email, full_name: fullName, role });
  if (error) throw error;
}
