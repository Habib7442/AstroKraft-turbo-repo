import "server-only";
import type { VastuLead } from "@astrokraft/db";
import { getSupabaseAdminClient } from "./supabase";
import { sendMetaEvent } from "./meta-capi";
import { confirmCalBooking } from "./cal-api";
import { CONSULTATION_FEE } from "./site";

/**
 * Mark the lead owning `razorpayOrderId` as paid. Idempotent: the browser's
 * verify call and Razorpay's webhook both land here for the same payment, and
 * only the first one to flip the row fires the Meta Purchase event.
 * Callers must have verified the Razorpay signature first.
 */
export async function markLeadPaid(razorpayOrderId: string, razorpayPaymentId: string): Promise<VastuLead | null> {
  const supabase = getSupabaseAdminClient();
  const { data: updated, error } = await supabase
    .from("vastu_leads")
    .update({
      payment_status: "paid",
      razorpay_payment_id: razorpayPaymentId,
      paid_at: new Date().toISOString(),
      amount_paid: CONSULTATION_FEE
    })
    .eq("razorpay_order_id", razorpayOrderId)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle<VastuLead>();
  if (error) throw error;

  if (updated) {
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

  // Already paid (the other path got there first), or unknown order.
  const { data: existing } = await supabase
    .from("vastu_leads")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle<VastuLead>();
  return existing?.payment_status === "paid" ? existing : null;
}
