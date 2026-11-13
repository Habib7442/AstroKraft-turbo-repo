import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { markLeadPaid } from "@/lib/mark-paid";
import { MASTERCLASS_APP, markRegistrationPaid } from "@/lib/masterclass";

// Backup to /api/razorpay/verify: marks the lead paid even if the visitor
// closes the tab before the browser's verify call. Razorpay Dashboard →
// Webhooks → https://<site>/api/webhooks/razorpay, events payment.captured,
// order.paid, payment.failed, secret = RAZORPAY_WEBHOOK_SECRET.
function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const a = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const payment = event.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id;
  // Same Razorpay account may serve AstroKraft too — only touch our orders.
  // Notes are set on both the order (create-order) and the checkout (payment).
  const notes = { ...event.payload?.order?.entity?.notes, ...payment?.notes };
  const app = notes.app;
  // "vastu" = 1:1 consultation (vastu_leads); "vastu-masterclass" = /vastu-masterclass.
  if (!orderId || (app !== "vastu" && app !== MASTERCLASS_APP)) return NextResponse.json({ ignored: true });
  const table = app === MASTERCLASS_APP ? "masterclass_registrations" : "vastu_leads";

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (app === MASTERCLASS_APP) {
        const registrationId = typeof notes.registrationId === "string" ? notes.registrationId : undefined;
        await markRegistrationPaid(orderId, payment.id, registrationId);
      } else {
        const leadId = typeof notes.leadId === "string" ? notes.leadId : undefined;
        await markLeadPaid(orderId, payment.id, leadId);
      }
    } else if (event.event === "payment.failed") {
      await getSupabaseAdminClient()
        .from(table)
        .update({ payment_status: "failed" })
        .eq("razorpay_order_id", orderId)
        .neq("payment_status", "paid");
    }
  } catch (error) {
    console.error("razorpay webhook failed:", error);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
