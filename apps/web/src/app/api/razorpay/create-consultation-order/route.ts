import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRazorpayOrder } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/ensure-profile";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to book a consultation." }, { status: 401 });
    }

    // consultations.user_id has a FK to profiles(id) — same reasoning as
    // create-order: don't depend on the Clerk webhook's async timing.
    await ensureProfile(userId);

    const body = await req.json().catch(() => null);
    const astrologerId = body?.astrologerId;
    const categoryId = body?.categoryId;
    const customerName = body?.customerName;
    const customerPhone = body?.customerPhone;
    const dob = body?.dob;
    const timeOfBirth = body?.timeOfBirth;
    const placeOfBirth = body?.placeOfBirth;

    if (!astrologerId || !categoryId || !customerName?.trim() || !customerPhone?.trim()) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    if (body?.termsAccepted !== true) {
      return NextResponse.json({ error: "You must accept the Terms & Conditions to book." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: astrologer, error: astrologerError } = await supabase
      .from("astrologers")
      .select("id, name, price, is_active")
      .eq("id", astrologerId)
      .maybeSingle();

    if (astrologerError) throw astrologerError;
    if (!astrologer || !astrologer.is_active) {
      return NextResponse.json({ error: "This astrologer is no longer available." }, { status: 400 });
    }
    if (!astrologer.price || astrologer.price <= 0) {
      return NextResponse.json({ error: "This astrologer has no consultation price set yet." }, { status: 400 });
    }

    const amountInPaise = Math.round(astrologer.price * 100);
    if (amountInPaise < 100) {
      return NextResponse.json({ error: "Consultation price must be at least ₹1." }, { status: 400 });
    }

    const { data: consultation, error: insertError } = await supabase
      .from("consultations")
      .insert({
        user_id: userId,
        astrologer_id: astrologerId,
        category_id: categoryId,
        astrologer_name: astrologer.name,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        kundli_details: { dob: dob || null, time_of_birth: timeOfBirth || null, place_of_birth: placeOfBirth || null },
        status: "payment_pending",
        amount: astrologer.price
      })
      .select()
      .single();

    if (insertError) throw insertError;

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: consultation.id,
        notes: { consultationId: consultation.id }
      });
    } catch (err: any) {
      await supabase.from("consultations").update({ status: "payment_failed" }).eq("id", consultation.id);
      const status = err?.statusCode === 401 ? 401 : 500;
      return NextResponse.json(
        { error: err?.error?.description || err?.message || "Failed to create Razorpay order." },
        { status }
      );
    }

    await supabase.from("consultations").update({ razorpay_order_id: razorpayOrder.id }).eq("id", consultation.id);

    return NextResponse.json({
      consultationId: consultation.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      astrologerName: astrologer.name
    });
  } catch (err: any) {
    console.error("razorpay create-consultation-order error:", err);
    return NextResponse.json({ error: err.message || "Failed to start booking." }, { status: 500 });
  }
}
