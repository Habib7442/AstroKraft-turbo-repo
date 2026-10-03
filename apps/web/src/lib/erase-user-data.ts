import { createR2Client, deleteR2Objects } from "@astrokraft/storage";
import { getSupabaseAdminClient } from "@/lib/supabase";

// Orders that never took a payment carry no tax/accounting retention duty,
// so they are erased with the account. Paid orders (and their shipping
// address) are kept for the statutory accounting period - DPDP s.8(7)
// allows retention "necessary for compliance with any law" - and are
// detached from the account by orders.user_id ON DELETE SET NULL.
const UNPAID_ORDER_STATUSES = ["created", "payment_pending", "payment_failed"];

// Idempotent: runs from both the self-service delete endpoint and the Clerk
// user.deleted webhook, so a second run must be a harmless no-op.
// Consultations, reviews and push tokens go with the profile row via
// ON DELETE CASCADE.
export async function eraseUserData(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: bookings, error: bookingsError } = await supabase
    .from("purohit_bookings")
    .select("id, attachment_key")
    .eq("user_id", userId);
  if (bookingsError) throw bookingsError;

  const attachmentKeys = (bookings ?? []).map((b) => b.attachment_key).filter((k): k is string => Boolean(k));
  if (attachmentKeys.length > 0) {
    await deleteR2Objects({
      client: createR2Client({
        accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
      }),
      bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      keys: attachmentKeys
    });
  }

  const steps = [
    supabase.from("purohit_bookings").delete().eq("user_id", userId),
    supabase.from("orders").delete().eq("user_id", userId).in("status", UNPAID_ORDER_STATUSES)
  ];
  for (const step of steps) {
    const { error } = await step;
    if (error) throw error;
  }

  const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
  if (profileError) throw profileError;
}
