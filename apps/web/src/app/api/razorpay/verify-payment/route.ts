import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendInvoiceEmail } from "@/lib/send-invoice-email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;
    const razorpayOrderId = body?.razorpay_order_id;
    const razorpayPaymentId = body?.razorpay_payment_id;
    const razorpaySignature = body?.razorpay_signature;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      await supabase
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", orderId)
        .eq("razorpay_order_id", razorpayOrderId);

      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("id", orderId)
      .eq("razorpay_order_id", razorpayOrderId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Order not found for this payment." }, { status: 400 });
    }

    // Email the invoice to the customer (BCC the owner) — best effort. The
    // payment already succeeded and is recorded; a failed email should never
    // turn a successful purchase into an error response.
    try {
      const [{ data: profile }, { data: items }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", data.user_id).maybeSingle(),
        supabase.from("order_items").select("title, price, quantity").eq("order_id", data.id)
      ]);

      const customerEmail = profile?.email;

      if (customerEmail) {
        await sendInvoiceEmail({
          to: customerEmail,
          subject: `Your AstroKraft invoice — Order ${data.order_number}`,
          html: `<p>Thank you for your order <strong>${data.order_number}</strong>. Your invoice is attached.</p>`,
          filenamePrefix: "AstroKraft-Invoice",
          order: {
            id: data.id,
            reference: data.order_number,
            amount: data.total_amount,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: razorpayPaymentId,
            status: "paid",
            created_at: data.created_at,
            items: (items ?? []).map((item) => ({ title: item.title, price: item.price, quantity: item.quantity }))
          },
          customer: { name: profile?.full_name ?? null, email: customerEmail }
        });
      }
    } catch (emailError) {
      console.error("razorpay verify-payment: invoice email failed:", emailError);
    }

    return NextResponse.json({ success: true, orderNumber: data.order_number });
  } catch (err: any) {
    console.error("razorpay verify-payment error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify payment." }, { status: 500 });
  }
}
