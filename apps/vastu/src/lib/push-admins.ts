import "server-only";
import type { VastuLead } from "@astrokraft/db";
import { getSupabaseAdminClient } from "./supabase";
import type { HostNotice } from "./notify-host";

// Push to every registered admin-app device (same push_tokens table and Expo
// push API as apps/web/src/lib/send-push-notification.ts). Tapping it opens
// the admin app's "1:1 Consultations" screen — data.type "vastu_consultation"
// is routed in apps/admin/src/lib/notification-routing.ts.

const TITLES: Record<HostNotice, string> = {
  confirmed: "New paid Vastu consultation ✅",
  rescheduled: "Vastu consultation rescheduled 🔁",
  cancelled: "Vastu consultation cancelled ❌"
};

/** Best-effort: never throws, so a push failure can't fail the Cal.com webhook. */
export async function pushToAdmins(kind: HostNotice, lead: VastuLead): Promise<void> {
  try {
    const { data: tokens, error } = await getSupabaseAdminClient().from("push_tokens").select("token, channel_id");
    if (error) throw error;
    if (!tokens?.length) return;

    const when = lead.scheduled_start
      ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(
          new Date(lead.scheduled_start)
        )
      : "time TBC";
    const body = `${lead.full_name} · ${when} · ${lead.business_category}${lead.city ? `, ${lead.city}` : ""}`;

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map((t) => ({
          to: t.token,
          title: TITLES[kind],
          body,
          sound: "default",
          priority: "high",
          channelId: t.channel_id || "default",
          data: { type: "vastu_consultation", leadId: lead.id }
        }))
      ),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) console.error("admin push failed:", res.status, await res.text().catch(() => ""));
  } catch (error) {
    console.error("admin push failed:", error);
  }
}
