import "server-only";
import { getRazorpayClient } from "@astrokraft/payments";
import type { VastuLead } from "@astrokraft/db";
import { getSupabaseAdminClient } from "./supabase";
import { sendMetaEvent } from "./meta-capi";
import { confirmCalBooking } from "./cal-api";
import { CONSULTATION_FEE } from "./site";

/** leadId from a Razorpay order's own notes (set by create-order) — trusted, server-fetched. */
async function leadIdFromRazorpayOrder(razorpayOrderId: string): Promise<string | null> {
  try {
    const order = await getRazorpayClient().orders.fetch(razorpayOrderId);
    const notes = (order.notes ?? {}) as Record<string, unknown>;
    return notes.app === "vastu" && typeof notes.leadId === "string" ? notes.leadId : null;
  } catch (error) {
    console.error("could not fetch Razorpay order", razorpayOrderId, error);
    return null;
  }
}

/**
 * Mark a lead paid for a captured Razorpay payment. Callers must have
 * verified the payment (checkout signature or signed webhook) first.
 *
 * Idempotent: the browser's verify call and Razorpay's webhook both land here
 * for the same payment, and only the first to flip the row confirms the
 * Cal.com booking and fires the Meta Purchase event.
 *
 * A lead's stored razorpay_order_id is normally the order being paid, but an
 * older order can still be paid (a slow UPI approval, a second tab). When no
 * row matches the order id, fall back to the leadId in the order's notes —
 * `leadIdHint` (from a signed webhook) or fetched from Razorpay — and record
 * the order id that was actually paid.
 */
export async function markLeadPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  leadIdHint?: string
): Promise<VastuLead | null> {
  const supabase = getSupabaseAdminClient();
  const paidFields = {
    payment_status: "paid",
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    paid_at: new Date().toISOString(),
    amount_paid: CONSULTATION_FEE
  };

  let { data: updated, error } = await supabase
    .from("vastu_leads")
    .update(paidFields)
    .eq("razorpay_order_id", razorpayOrderId)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle<VastuLead>();
  if (error) throw error;

  if (!updated) {
    const { data: byOrder } = await supabase
      .from("vastu_leads")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle<VastuLead>();
    if (byOrder?.payment_status === "paid") return byOrder; // the other path got here first

    const leadId = leadIdHint ?? (await leadIdFromRazorpayOrder(razorpayOrderId));
    if (!leadId) return null;

    ({ data: updated, error } = await supabase
      .from("vastu_leads")
      .update(paidFields)
      .eq("id", leadId)
      .neq("payment_status", "paid")
      .select("*")
      .maybeSingle<VastuLead>());
    if (error) throw error;

    if (!updated) {
      const { data: lead } = await supabase.from("vastu_leads").select("*").eq("id", leadId).maybeSingle<VastuLead>();
      if (lead?.payment_status === "paid" && lead.razorpay_payment_id !== razorpayPaymentId) {
        // Paid twice (two orders both completed). Keep the first; flag the
        // second for a manual refund.
        console.error("DUPLICATE vastu payment — refund needed:", { leadId, razorpayOrderId, razorpayPaymentId });
      }
      return lead?.payment_status === "paid" ? lead : null;
    }
  }

  // No uid yet means Cal.com's webhook hasn't arrived; the Cal webhook
  // confirms on BOOKING_REQUESTED once it sees the lead is already paid.
  if (updated.cal_booking_uid) await confirmCalBooking(updated.cal_booking_uid);
  await sendMetaEvent({
    eventName: "Purchase",
    eventId: `purchase_${updated.id}`,
    lead: updated,
    customData: { currency: "INR", value: CONSULTATION_FEE, content_name: "1:1 Business Vastu Consultation" }
  });
  return updated;
}
