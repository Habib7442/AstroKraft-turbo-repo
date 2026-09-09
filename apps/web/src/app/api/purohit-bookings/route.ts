import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { purohitBookingSchema } from "@astrokraft/validators";
import type { PurohitBooking } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendPurohitBookingEmail } from "@/lib/send-purohit-booking-email";
import { sendPushNotificationToAdmins } from "@/lib/send-push-notification";

const RATE_LIMIT_MAX_PER_HOUR = 3;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = purohitBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid booking details." }, { status: 400 });
    }

    const data = parsed.data;

    // A bot fills the hidden honeypot field. Respond exactly like a real
    // success so the bot cannot tell the submission was rejected, but write
    // nothing.
    if (data.website) {
      return NextResponse.json({ bookingId: "ok", status: "new" });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (data.preferredDate < todayStr) {
      return NextResponse.json({ error: "Preferred date cannot be in the past." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    // One normalized value for both the rate-limit lookup and the insert —
    // otherwise a caller varying whitespace between requests never matches
    // the already-stored (trimmed) rows and bypasses the limit entirely.
    const phone = data.phone.trim();

    const { userId } = await auth();

    // Count-then-insert as two separate round-trips would let two
    // concurrent requests for the same phone both read count < limit before
    // either commits (TOCTOU). create_purohit_booking does both inside one
    // transaction, serialized per-phone with a Postgres advisory lock, so
    // the limit holds even under real concurrency.
    const { data: booking, error: rpcError } = await supabase
      .rpc("create_purohit_booking", {
        p_user_id: userId || null,
        p_name: data.name.trim(),
        p_phone: phone,
        p_location: data.location.trim(),
        p_ritual_type: data.ritualType.trim(),
        p_preferred_date: data.preferredDate,
        p_preferred_time: data.preferredTime || null,
        p_language_preference: data.languagePreference.trim(),
        p_materials_option: data.materialsOption,
        p_message: data.message?.trim() || null,
        p_attachment_key: data.attachmentKey || null,
        p_rate_limit_max: RATE_LIMIT_MAX_PER_HOUR,
        p_rate_limit_window: "1 hour"
      })
      .single<PurohitBooking>();

    if (rpcError) {
      if (rpcError.message?.includes("rate_limit_exceeded")) {
        return NextResponse.json(
          { error: "You've already sent a few requests. Please wait for our team's callback before submitting again." },
          { status: 429 }
        );
      }
      throw rpcError;
    }

    try {
      await sendPurohitBookingEmail(booking);
    } catch (emailError) {
      console.error("purohit booking notification email failed:", emailError);
    }

    // Push a WhatsApp-style alert (banner + sound) to every admin device —
    // best effort, same reasoning as the email above.
    try {
      await sendPushNotificationToAdmins({
        title: "New Purohit Booking 🪔",
        body: `${booking.name} — ${booking.ritual_type}`,
        data: { type: "purohit_booking", bookingId: booking.id }
      });
    } catch (pushError) {
      console.error("purohit booking push notification failed:", pushError);
    }

    return NextResponse.json({ bookingId: booking.id, status: booking.status });
  } catch (err: any) {
    console.error("purohit-bookings create error:", err);
    return NextResponse.json({ error: "Failed to submit your request." }, { status: 500 });
  }
}
