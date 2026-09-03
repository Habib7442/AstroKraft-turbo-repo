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
  const { data: tokens, error } = await supabase.from("push_tokens").select("token");
  if (error) throw error;
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    sound: "default",
    priority: "high",
    channelId: "default",
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
