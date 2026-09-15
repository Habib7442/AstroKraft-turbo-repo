import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendInvoiceEmail } from "@/lib/send-invoice-email";
import { sendPushNotificationToAdmins } from "@/lib/send-push-notification";
import { sendTelegramNotification, escapeTelegramHtml } from "@/lib/send-telegram-notification";

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

    // Fetched once and reused by both the invoice email and the Telegram
    // alert below — best effort, same reasoning as those two: a failed read
    // here should never turn an already-successful purchase into an error
    // response, it just means the alerts below fall back to what's already
    // on `data` alone.
    let profile: { full_name: string | null; email: string | null } | null = null;
    let items: { title: string; price: number; quantity: number }[] = [];
    try {
      const [profileResult, itemsResult] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", data.user_id).maybeSingle(),
        supabase.from("order_items").select("title, price, quantity").eq("order_id", data.id)
      ]);
      profile = profileResult.data;
      items = itemsResult.data ?? [];
    } catch (lookupError) {
      console.error("razorpay verify-payment: profile/items lookup failed:", lookupError);
    }

    // Email the invoice to the customer (BCC the owner) — best effort. The
    // payment already succeeded and is recorded; a failed email should never
    // turn a successful purchase into an error response.
    try {
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

    // Push a WhatsApp-style alert (banner + sound) to every admin device —
    // best effort, same reasoning as the invoice email above.
    try {
      await sendPushNotificationToAdmins({
        title: "New Order 📦",
        body: `Order ${data.order_number} — ₹${data.total_amount.toLocaleString("en-IN")}`,
        data: { type: "order", orderId: data.id }
      });
    } catch (pushError) {
      console.error("razorpay verify-payment: push notification failed:", pushError);
    }

    try {
      const shippingAddress = data.shipping_address as
        | { fullName?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string }
        | null;

      const itemLines = items.map(
        (item) => `• ${escapeTelegramHtml(item.title)} x${item.quantity} — ₹${item.price.toLocaleString("en-IN")}`
      );

      const addressLine = shippingAddress
        ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
            .filter(Boolean)
            .map((part) => escapeTelegramHtml(String(part)))
            .join(", ")
        : null;

      await sendTelegramNotification({
        text: [
          "📦 <b>New Order</b>",
          `${escapeTelegramHtml(data.order_number)} — ₹${data.total_amount.toLocaleString("en-IN")}`,
          `Customer: ${escapeTelegramHtml(shippingAddress?.fullName || profile?.full_name || "—")}${shippingAddress?.phone ? ` (${escapeTelegramHtml(shippingAddress.phone)})` : ""}`,
          itemLines.length > 0 ? `Items:\n${itemLines.join("\n")}` : null,
          addressLine ? `Ship to: ${addressLine}` : null,
          `Payment ID: ${escapeTelegramHtml(razorpayPaymentId)}`
        ]
          .filter(Boolean)
          .join("\n")
      });
    } catch (telegramError) {
      console.error("razorpay verify-payment: telegram notification failed:", telegramError);
    }

    return NextResponse.json({ success: true, orderNumber: data.order_number });
  } catch (err: any) {
    console.error("razorpay verify-payment error:", err);
    return NextResponse.json({ error: "Failed to verify payment." }, { status: 500 });
  }
}
