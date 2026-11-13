import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayClient, verifyRazorpaySignature } from "@astrokraft/payments";
import { markRegistrationPaid } from "@/lib/masterclass";

const bodySchema = z.object({
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().regex(/^[0-9a-f]{64}$/i)
});

// Called by the masterclass page with Razorpay checkout's success payload.
// The signed webhook (/api/webhooks/razorpay) is the backup if the tab closes.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  const { orderId, paymentId, signature } = parsed.data;

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  // The checkout signature only proves Razorpay issued this payment for this
  // order — not that the money was captured. Paid access (the group invite)
  // is granted only for a captured payment, confirmed from Razorpay itself.
  let payment: { order_id?: string | null; status?: string; currency?: string; amount?: number | string };
  try {
    payment = await getRazorpayClient().payments.fetch(paymentId);
  } catch (error) {
    console.error("masterclass verify: could not fetch payment", paymentId, error);
    // The thank-you page keeps checking; the webhook records it once captured.
    return NextResponse.json({ pending: true }, { status: 503 });
  }
  if (payment.order_id !== orderId || payment.currency !== "INR") {
    console.error("masterclass verify: payment does not match order", { paymentId, orderId });
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  if (payment.status !== "captured") {
    // e.g. "authorized" — the payment.captured webhook finishes the job.
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  try {
    const row = await markRegistrationPaid(orderId, paymentId, undefined, Number(payment.amount));
    if (!row) return NextResponse.json({ error: "Registration not found for this payment." }, { status: 404 });
    return NextResponse.json({ paid: true, registrationId: row.id });
  } catch (error) {
    console.error("masterclass verify failed:", error);
    return NextResponse.json(
      { error: "Payment received but we could not confirm your seat yet. We'll confirm on WhatsApp." },
      { status: 500 }
    );
  }
}
