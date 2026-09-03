import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendInvoiceEmail } from "@/lib/send-invoice-email";
import { sendPushNotificationToAdmins } from "@/lib/send-push-notification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const consultationId = body?.consultationId;
    const razorpayOrderId = body?.razorpay_order_id;
    const razorpayPaymentId = body?.razorpay_payment_id;
    const razorpaySignature = body?.razorpay_signature;

    if (!consultationId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
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
        .from("consultations")
        .update({ status: "payment_failed" })
        .eq("id", consultationId)
        .eq("razorpay_order_id", razorpayOrderId);

      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("consultations")
      .update({ status: "booked", razorpay_payment_id: razorpayPaymentId })
      .eq("id", consultationId)
      .eq("razorpay_order_id", razorpayOrderId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Booking not found for this payment." }, { status: 400 });
    }

    // Email the invoice to the customer (BCC the owner) — best effort. The
    // payment already succeeded and is recorded; a failed email should never
    // turn a successful booking into an error response.
    try {
      const [{ data: profile }, { data: category }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", data.user_id).maybeSingle(),
        data.category_id
          ? supabase.from("consultation_categories").select("name").eq("id", data.category_id).maybeSingle()
          : Promise.resolve({ data: null })
      ]);

      const customerEmail = profile?.email;

      if (customerEmail) {
        await sendInvoiceEmail({
          to: customerEmail,
          subject: `Your AstroKraft invoice — Consultation with ${data.astrologer_name}`,
          html: `<p>Thank you for booking a consultation with <strong>${data.astrologer_name}</strong>. Your invoice is attached. We&rsquo;ll reach out shortly to schedule your session.</p>`,
          filenamePrefix: "AstroKraft-Invoice",
          order: {
            id: data.id,
            reference: `Consultation ${data.id.slice(0, 8).toUpperCase()}`,
            amount: data.amount,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: razorpayPaymentId,
            status: "booked",
            created_at: data.created_at,
            items: [
              {
                title: `Consultation with ${data.astrologer_name}`,
                subtitle: category?.name ?? null,
                price: data.amount,
                quantity: 1
              }
            ]
          },
          customer: { name: profile?.full_name ?? data.customer_name ?? null, email: customerEmail }
        });
      }
    } catch (emailError) {
      console.error("razorpay verify-consultation-payment: invoice email failed:", emailError);
    }

    // Push a WhatsApp-style alert (banner + sound) to every admin device —
    // best effort, same reasoning as the invoice email above.
    try {
      await sendPushNotificationToAdmins({
        title: "New Consultation Booked 🔮",
        body: `${data.astrologer_name} — ₹${data.amount.toLocaleString("en-IN")} (${data.customer_name || "Guest"})`,
        data: { type: "consultation", consultationId: data.id }
      });
    } catch (pushError) {
      console.error("razorpay verify-consultation-payment: push notification failed:", pushError);
    }

    return NextResponse.json({ success: true, astrologerName: data.astrologer_name });
  } catch (err: any) {
    console.error("razorpay verify-consultation-payment error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify payment." }, { status: 500 });
  }
}
