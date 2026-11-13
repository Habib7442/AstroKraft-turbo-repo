import "server-only";
import { getRazorpayClient } from "@astrokraft/payments";
import type { MasterclassRegistration } from "@astrokraft/db";
import { getSupabaseAdminClient } from "./supabase";
import { sendMetaEvent } from "./meta-capi";
import { appendPaidRegistration, isSheetConfigured } from "./google-sheets";
import { WORKSHOP_DATE_LABEL, WORKSHOP_FEE } from "./workshop";

/**
 * WhatsApp community invite shown on the thank-you page for PAID registrations
 * only. Server-only env (no NEXT_PUBLIC_), so it never ships in the page's JS
 * to visitors who haven't paid. Must be a chat.whatsapp.com invite link.
 */
const groupInvite = process.env.WHATSAPP_GROUP_INVITE_LINK?.trim();
export const MASTERCLASS_GROUP_INVITE_URL = groupInvite && /^https:\/\/chat\.whatsapp\.com\/\S+$/.test(groupInvite) ? groupInvite : null;

/** Razorpay notes.app for masterclass orders — the webhook routes on it. */
export const MASTERCLASS_APP = "vastu-masterclass";

const TEAM_EMAIL = "astrokraftwebsitemanagement@gmail.com";
const FROM = process.env.VASTU_NOTIFY_FROM || "AstroKraft <bookings@mail.astrokraft.online>";

/** Meta event ids shared by the browser pixel and CAPI so Meta dedupes them. */
export const masterclassEventId = (kind: "initiate" | "purchase", registrationId: string) => `${kind}_mc_${registrationId}`;

/** registrationId from a Razorpay order's own notes (set by create-order) — trusted, server-fetched. */
async function registrationIdFromOrder(razorpayOrderId: string): Promise<string | null> {
  try {
    const order = await getRazorpayClient().orders.fetch(razorpayOrderId);
    const notes = (order.notes ?? {}) as Record<string, unknown>;
    return notes.app === MASTERCLASS_APP && typeof notes.registrationId === "string" ? notes.registrationId : null;
  } catch (error) {
    console.error("could not fetch Razorpay order", razorpayOrderId, error);
    return null;
  }
}

/**
 * Mark a registration paid for a captured Razorpay payment. Callers must have
 * verified the payment (signed webhook, or checkout signature plus a server
 * fetch confirming it was captured) first.
 *
 * Idempotent: the browser's verify call and Razorpay's webhook both land here
 * for the same payment; only the call that flips the row sends the team email
 * and the Meta Purchase event. An older order completing late (a slow UPI
 * approval after a retry created a new order) is found through the order's
 * notes.registrationId; a second payment for an already-paid row is logged
 * for a manual refund.
 */
export async function markRegistrationPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  registrationIdHint?: string,
  /** The captured payment's amount from Razorpay — stored so emails, the Sheet and Meta report what was actually paid. */
  amountPaise?: number
): Promise<MasterclassRegistration | null> {
  const supabase = getSupabaseAdminClient();
  const paidFields = {
    payment_status: "paid",
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    paid_at: new Date().toISOString(),
    ...(Number.isInteger(amountPaise) && amountPaise! >= 100 ? { amount_paise: amountPaise } : {})
  };

  let { data: updated, error } = await supabase
    .from("masterclass_registrations")
    .update(paidFields)
    .eq("razorpay_order_id", razorpayOrderId)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle<MasterclassRegistration>();
  if (error) throw error;

  if (!updated) {
    const { data: byOrder } = await supabase
      .from("masterclass_registrations")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle<MasterclassRegistration>();
    if (byOrder?.payment_status === "paid") {
      // The other path got here first — still make sure the Sheet row exists
      // (no-op if it does; retries if that path's Sheet write failed).
      await syncRegistrationToSheet(byOrder);
      return byOrder;
    }

    const registrationId = registrationIdHint ?? (await registrationIdFromOrder(razorpayOrderId));
    if (!registrationId) return null;

    ({ data: updated, error } = await supabase
      .from("masterclass_registrations")
      .update(paidFields)
      .eq("id", registrationId)
      .neq("payment_status", "paid")
      .select("*")
      .maybeSingle<MasterclassRegistration>());
    if (error) throw error;

    if (!updated) {
      const { data: row } = await supabase
        .from("masterclass_registrations")
        .select("*")
        .eq("id", registrationId)
        .maybeSingle<MasterclassRegistration>();
      if (row?.payment_status === "paid" && row.razorpay_payment_id !== razorpayPaymentId) {
        console.error("DUPLICATE masterclass payment — refund needed:", { registrationId, razorpayOrderId, razorpayPaymentId });
      }
      if (row?.payment_status !== "paid") return null;
      await syncRegistrationToSheet(row);
      return row;
    }
  }

  await Promise.all([notifyTeam(updated), sendPurchaseEvent(updated), syncRegistrationToSheet(updated)]);
  return updated;
}

/** How long a Sheet-sync claim blocks other callers; longer than the 15s Sheets request timeout. */
const SHEET_CLAIM_TTL_MS = 2 * 60 * 1000;

/**
 * Append a PAID registration to the Google Sheet. Only ever called with a row
 * the database already records as paid — i.e. after a verified, captured
 * payment — never on the client's word.
 *
 * Concurrent callers (verify + webhook arriving together): a conditional
 * UPDATE takes a short-lived claim (sheet_sync_claimed_at, only if unclaimed
 * or expired), so one caller appends. sheet_synced_at is the completion
 * marker and is set only AFTER the Sheet confirmed the append. If the append
 * fails the claim is released; if the process dies mid-append the claim simply
 * expires — either way the next webhook delivery / thank-you page load
 * retries, and the script's Payment-ID check keeps a retry from duplicating
 * the row. Never throws.
 */
export async function syncRegistrationToSheet(row: MasterclassRegistration): Promise<void> {
  if (row.payment_status !== "paid" || row.sheet_synced_at || !isSheetConfigured()) return;
  if (!row.razorpay_payment_id || !row.razorpay_order_id) return;

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - SHEET_CLAIM_TTL_MS).toISOString();
  const { data: claimed, error } = await supabase
    .from("masterclass_registrations")
    .update({ sheet_sync_claimed_at: now.toISOString() })
    .eq("id", row.id)
    .eq("payment_status", "paid")
    .is("sheet_synced_at", null)
    .or(`sheet_sync_claimed_at.is.null,sheet_sync_claimed_at.lt.${staleBefore}`)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("could not claim masterclass sheet sync:", row.id, error);
    return;
  }
  if (!claimed) return; // another caller is writing (or already wrote) this row

  try {
    await appendPaidRegistration({
      paidAt: row.paid_at ? new Date(row.paid_at) : new Date(),
      fullName: row.full_name,
      whatsapp: row.whatsapp,
      amountRupees: row.amount_paise / 100,
      paymentId: row.razorpay_payment_id,
      orderId: row.razorpay_order_id
    });
  } catch (sheetError) {
    console.error("Google Sheet write failed for masterclass registration — will retry:", row.id, sheetError);
    await supabase.from("masterclass_registrations").update({ sheet_sync_claimed_at: null }).eq("id", row.id);
    return;
  }

  const { error: doneError } = await supabase
    .from("masterclass_registrations")
    .update({ sheet_synced_at: new Date().toISOString(), sheet_sync_claimed_at: null })
    .eq("id", row.id);
  // The row is in the Sheet; a later retry would be de-duplicated by Payment ID.
  if (doneError) console.error("could not mark masterclass sheet sync done:", row.id, doneError);
}

function sendPurchaseEvent(row: MasterclassRegistration) {
  return sendMetaEvent({
    eventName: "Purchase",
    eventId: masterclassEventId("purchase", row.id),
    lead: { ...row, city: "", state: "" },
    customData: { currency: "INR", value: row.amount_paise / 100, content_name: "Astro Vastu Masterclass" }
  });
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Never throws — a failed email is logged and must not fail the payment. */
async function notifyTeam(row: MasterclassRegistration): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — team not notified for masterclass registration", row.id);
    return;
  }
  const rows: [string, string][] = [
    ["Name", row.full_name],
    ["WhatsApp", row.whatsapp],
    ["Paid", `₹${row.amount_paise / 100}`],
    ["Session", row.session_label ?? WORKSHOP_DATE_LABEL ?? "Not set"],
    ["Payment ID", row.razorpay_payment_id ?? "—"],
    ["Source", [row.utm_source, row.utm_campaign].filter(Boolean).join(" · ") || "—"]
  ];
  const html = `<h2>New Astro Vastu Masterclass registration ✅</h2><table style="font-family:Arial,sans-serif;font-size:15px">${rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#777">${escapeHtml(k)}</td><td><b>${escapeHtml(v)}</b></td></tr>`)
    .join("")}</table><p>Send them the Zoom link on WhatsApp if they haven't joined the group yet.</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TEAM_EMAIL],
        subject: `Masterclass registration — ${row.full_name}`,
        html,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n")
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) console.error("masterclass team email failed:", res.status, await res.text());
  } catch (error) {
    console.error("masterclass team email failed:", error);
  }
}

/** The fee in paise, fixed server-side. */
export const MASTERCLASS_AMOUNT_PAISE = WORKSHOP_FEE * 100;
