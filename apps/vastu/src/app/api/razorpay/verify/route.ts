import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyRazorpaySignature } from "@astrokraft/payments";
import { markLeadPaid } from "@/lib/mark-paid";

const bodySchema = z.object({
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().regex(/^[0-9a-f]{64}$/i)
});

// Called by the /pay page with Razorpay checkout's success handler payload.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  const { orderId, paymentId, signature } = parsed.data;

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  try {
    const lead = await markLeadPaid(orderId, paymentId);
    if (!lead) return NextResponse.json({ error: "Booking not found for this payment." }, { status: 404 });
    return NextResponse.json({ paid: true, leadId: lead.id });
  } catch (error) {
    console.error("vastu verify failed:", error);
    return NextResponse.json({ error: "Payment received but we could not update your booking. We'll confirm on WhatsApp." }, { status: 500 });
  }
}
