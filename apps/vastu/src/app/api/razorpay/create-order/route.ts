import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRazorpayOrder, formatINRToPaise, getRazorpayClient } from "@astrokraft/payments";
import { markLeadPaid } from "@/lib/mark-paid";
import type { VastuLead } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { CONSULTATION_FEE } from "@/lib/site";

const bodySchema = z.object({ leadId: z.string().uuid() });

// The amount is fixed server-side; the client only says which lead is paying.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking reference." }, { status: 400 });
  const { leadId } = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: lead } = await supabase
      .from("vastu_leads")
      .select("id, full_name, whatsapp, attendee_email, payment_status, razorpay_order_id")
      .eq("id", leadId)
      .maybeSingle<Pick<VastuLead, "id" | "full_name" | "whatsapp" | "attendee_email" | "payment_status" | "razorpay_order_id">>();

    if (!lead) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (lead.payment_status === "paid") return NextResponse.json({ alreadyPaid: true });

    const amount = formatINRToPaise(CONSULTATION_FEE);

    // Reuse the stored order while it can still be paid. A refresh, a second
    // tab or "Retry payment" must not replace an order that a slow UPI
    // approval may still complete (markLeadPaid also falls back to the
    // order's notes.leadId, but reusing keeps one order per lead).
    const existing = lead.razorpay_order_id
      ? await getRazorpayClient().orders.fetch(lead.razorpay_order_id).catch(() => null)
      : null;

    if (existing?.status === "paid") {
      // Paid but not yet recorded (verify call and webhook both missed so
      // far): record it now from Razorpay's own data.
      const payments = await getRazorpayClient().orders.fetchPayments(existing.id);
      const captured = payments.items.find((p) => p.status === "captured");
      if (captured) await markLeadPaid(existing.id, captured.id, lead.id);
      return NextResponse.json({ alreadyPaid: true });
    }

    const reusable =
      existing && (existing.status === "created" || existing.status === "attempted") && Number(existing.amount) === amount ? existing : null;

    const order =
      reusable ??
      (await createRazorpayOrder({
        amount,
        currency: "INR",
        receipt: `vastu_${lead.id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
        notes: { app: "vastu", leadId: lead.id }
      }));

    const { error } = await supabase
      .from("vastu_leads")
      .update({ razorpay_order_id: order.id, payment_status: "pending" })
      .eq("id", lead.id)
      .neq("payment_status", "paid");
    if (error) throw error;

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: { name: lead.full_name, contact: lead.whatsapp, email: lead.attendee_email ?? undefined }
    });
  } catch (error) {
    console.error("vastu create-order failed:", error);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
