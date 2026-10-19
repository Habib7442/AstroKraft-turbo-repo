import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRazorpayOrder, formatINRToPaise } from "@astrokraft/payments";
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
      .select("id, full_name, whatsapp, attendee_email, payment_status")
      .eq("id", leadId)
      .maybeSingle<Pick<VastuLead, "id" | "full_name" | "whatsapp" | "attendee_email" | "payment_status">>();

    if (!lead) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (lead.payment_status === "paid") return NextResponse.json({ alreadyPaid: true });

    // A fresh order per attempt: a retry after a failed/abandoned checkout
    // replaces the previous order id, so only the latest order can mark paid.
    const order = await createRazorpayOrder({
      amount: formatINRToPaise(CONSULTATION_FEE),
      currency: "INR",
      receipt: `vastu_${lead.id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
      notes: { app: "vastu", leadId: lead.id }
    });

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
