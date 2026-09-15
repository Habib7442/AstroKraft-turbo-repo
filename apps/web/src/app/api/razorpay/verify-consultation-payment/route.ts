import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendInvoiceEmail } from "@/lib/send-invoice-email";
import { sendPushNotificationToAdmins } from "@/lib/send-push-notification";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/send-telegram-notification";

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

    const kundliDetails = (data.kundli_details ?? {}) as { dob?: string; time_of_birth?: string; place_of_birth?: string };
    const kundliDob = kundliDetails.dob || null;
    const kundliTimeOfBirth = kundliDetails.time_of_birth || null;
    const kundliPlaceOfBirth = kundliDetails.place_of_birth || null;

    // No astrologer is assigned yet at this point (an admin does that
    // afterward) — every customer/admin-facing message below names the
    // category instead, the only thing actually known right now.
    const { data: category } = data.category_id
      ? await supabase.from("consultation_categories").select("name").eq("id", data.category_id).maybeSingle()
      : { data: null };
    const categoryName = category?.name ?? "Consultation";

    // Email the invoice to the customer (BCC the owner) — best effort. The
    // payment already succeeded and is recorded; a failed email should never
    // turn a successful booking into an error response.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", data.user_id)
        .maybeSingle();

      const customerEmail = profile?.email;

      if (customerEmail) {
        await sendInvoiceEmail({
          to: customerEmail,
          subject: `Your AstroKraft invoice — ${categoryName} Consultation`,
          html: `<p>Thank you for booking a <strong>${categoryName}</strong> consultation. Your invoice is attached. We&rsquo;ll assign one of our verified astrologers and reach out shortly to schedule your session.</p>`,
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
                title: `${categoryName} Consultation`,
                subtitle: "Astrologer to be assigned by our team",
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
    // best effort, same reasoning as the invoice email above. This is also
    // the admin's cue to assign an astrologer to this booking.
    try {
      await sendPushNotificationToAdmins({
        title: "New Consultation Booked 🔮",
        body: `${categoryName} — ₹${data.amount.toLocaleString("en-IN")} (${data.customer_name || "Guest"}) — needs an astrologer assigned`,
        data: { type: "consultation", consultationId: data.id }
      });
    } catch (pushError) {
      console.error("razorpay verify-consultation-payment: push notification failed:", pushError);
    }

    try {
      await sendTelegramNotification({
        text: [
          "🔮 <b>New Consultation Booked</b>",
          `${escapeTelegramHtml(categoryName)} — ₹${data.amount.toLocaleString("en-IN")}`,
          `Customer: ${escapeTelegramHtml(data.customer_name || "Guest")}${data.customer_phone ? ` (${escapeTelegramHtml(data.customer_phone)})` : ""}`,
          kundliDob ? `DOB: ${escapeTelegramHtml(kundliDob)}` : null,
          kundliTimeOfBirth ? `Time of Birth: ${escapeTelegramHtml(kundliTimeOfBirth)}` : null,
          kundliPlaceOfBirth ? `Place of Birth: ${escapeTelegramHtml(kundliPlaceOfBirth)}` : null,
          `Payment ID: ${escapeTelegramHtml(razorpayPaymentId)}`,
          "Needs an astrologer assigned."
        ]
          .filter(Boolean)
          .join("\n")
      });
    } catch (telegramError) {
      console.error("razorpay verify-consultation-payment: telegram notification failed:", telegramError);
    }

    return NextResponse.json({ success: true, categoryName });
  } catch (err: any) {
    console.error("razorpay verify-consultation-payment error:", err);
    return NextResponse.json({ error: "Failed to verify payment." }, { status: 500 });
  }
}
