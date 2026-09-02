import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured; rejecting webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Must read the raw body for signature verification — parsing JSON first
  // would compute the HMAC over re-serialized (potentially different) bytes.
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = getSupabaseAdminClient();

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const razorpayPaymentId = payment?.id;

    if (razorpayOrderId && razorpayPaymentId) {
      await supabase
        .from("orders")
        .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
        .eq("razorpay_order_id", razorpayOrderId)
        .neq("status", "paid");
    }
  }

  if (event.event === "payment.failed") {
    const razorpayOrderId = event.payload?.payment?.entity?.order_id;

    if (razorpayOrderId) {
      await supabase
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("razorpay_order_id", razorpayOrderId)
        .neq("status", "paid");
    }
  }

  return NextResponse.json({ received: true });
}
