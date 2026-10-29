import "server-only";
import type { VastuLead } from "@astrokraft/db";
import { offerForCategory } from "./site";

// Biprangshu isn't expected to use Cal.com, so each PAID booking reaches him
// as one plain email with everything needed for the call, plus a copy to the
// team. Sent via Resend from the already-verified mail.astrokraft.online domain.
const HOST_EMAIL = "vastubipra@gmail.com";
const TEAM_EMAIL = "astrokraftwebsitemanagement@gmail.com";
const FROM = process.env.VASTU_NOTIFY_FROM || "VASTU by Biprangshu <bookings@mail.astrokraft.online>";

export type HostNotice = "confirmed" | "rescheduled" | "cancelled";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const formatSlot = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " (IST)"
    : "Time not available — check Cal.com";

const HEADINGS: Record<HostNotice, { subject: string; title: string; note: string }> = {
  confirmed: {
    subject: "New paid Vastu consultation",
    title: "New paid consultation ✅",
    note: "Payment received and the slot is confirmed. Tap the join link at the time of the call."
  },
  rescheduled: {
    subject: "Vastu consultation rescheduled",
    title: "Consultation rescheduled 🔁",
    note: "The client moved this paid consultation to a new time. Use the join link below."
  },
  cancelled: {
    subject: "Vastu consultation CANCELLED",
    title: "Consultation cancelled ❌",
    note: "This paid consultation was cancelled. The team will handle any refund as per the refund policy."
  }
};

/** Never throws — a failed email is logged and must not break the webhook. */
export async function notifyHost(kind: HostNotice, lead: VastuLead, meetingUrl?: string | null): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — host not notified for lead", lead.id);
    return;
  }

  const h = HEADINGS[kind];
  const slot = formatSlot(lead.scheduled_start);
  const rows: [string, string][] = [
    ["Consultation", offerForCategory(lead.business_category).name],
    ["Client", lead.full_name],
    ["Phone", lead.whatsapp || "—"],
    ["When", slot],
    ["Business", `${lead.business_category} (${lead.business_stage})`],
    ["Location", [lead.city, lead.state].filter(Boolean).join(", ") || "—"],
    ["Main concern", lead.problems?.length ? lead.problems.join(", ") : "—"],
    [
      "Floor plan",
      lead.floor_plan_available === null
        ? "Not answered — ask for the floor plan or photos"
        : lead.floor_plan_available
          ? "Yes — ask them to share it on WhatsApp"
          : "No — ask for photos or a rough sketch"
    ]
  ];
  const showJoin = kind !== "cancelled" && !!meetingUrl;

  const html = `<!doctype html><html><body style="margin:0;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
  <div style="background:#0a0a0c;color:#e9cf7a;border-radius:14px 14px 0 0;padding:18px 20px;font-size:13px;letter-spacing:2px">VASTU by BIPRANGSHU</div>
  <div style="background:#ffffff;border-radius:0 0 14px 14px;padding:20px">
    <h1 style="margin:0 0 6px;font-size:22px">${escapeHtml(h.title)}</h1>
    <p style="margin:0 0 18px;color:#555;font-size:14px">${escapeHtml(h.note)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;color:#777;width:38%;vertical-align:top">${escapeHtml(k)}</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(v)}</td></tr>`
        )
        .join("")}
    </table>
    ${
      showJoin
        ? `<a href="${escapeHtml(meetingUrl!)}" style="display:block;margin-top:20px;background:#d4af37;color:#0a0a0c;text-align:center;text-decoration:none;font-weight:bold;font-size:17px;padding:14px;border-radius:999px">Join the call</a>
    <p style="margin:10px 0 0;color:#777;font-size:12px;word-break:break-all">Link: ${escapeHtml(meetingUrl!)}</p>`
        : kind !== "cancelled"
          ? `<p style="margin-top:18px;color:#a8841f;font-size:14px">The join link will be in the calendar invite / Cal.com booking.</p>`
          : ""
    }
  </div>
</div></body></html>`;

  const text = [
    h.title,
    h.note,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    showJoin ? `\nJoin the call: ${meetingUrl}` : ""
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [HOST_EMAIL],
        cc: [TEAM_EMAIL],
        subject: `${h.subject} — ${lead.full_name}, ${slot}`,
        html,
        text
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) console.error("host notification failed:", res.status, await res.text());
  } catch (error) {
    console.error("host notification failed:", error);
  }
}
