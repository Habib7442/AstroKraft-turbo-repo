import { getSupabaseAdminClient } from "@/lib/supabase";

interface PushNotificationInput {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Best-effort, mirrors sendInvoiceEmail — a failed push must never turn an
// already-successful payment into an error response. Sends to every
// registered admin device (the whole point: whoever's holding a phone with
// the admin app installed gets notified, WhatsApp-style).
export async function sendPushNotificationToAdmins({ title, body, data }: PushNotificationInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: tokens, error } = await supabase.from("push_tokens").select("token, channel_id");
  if (error) throw error;
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    sound: "default",
    priority: "high",
    // Target whatever channel this device last confirmed it created
    // (use-register-push-token.ts upserts channel_id on every app launch).
    // A device that hasn't run the updated app yet has no "alerts" channel
    // — Android silently drops a push naming a channel that doesn't exist
    // locally — so fall back to "default" for it instead of guessing.
    channelId: t.channel_id || "default",
    data: data ?? {}
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
    body: JSON.stringify(messages)
  });

  if (!res.ok) {
    throw new Error(`Expo push API returned ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
