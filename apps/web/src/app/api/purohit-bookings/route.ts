import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { purohitBookingSchema } from "@astrokraft/validators";
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

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: rateLimitError } = await supabase
      .from("purohit_bookings")
      .select("id", { count: "exact", head: true })
      .eq("phone", data.phone)
      .gte("created_at", oneHourAgo);

    if (rateLimitError) throw rateLimitError;
    if ((count ?? 0) >= RATE_LIMIT_MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "You've already sent a few requests. Please wait for our team's callback before submitting again." },
        { status: 429 }
      );
    }

    const { userId } = await auth();

    const { data: booking, error: insertError } = await supabase
      .from("purohit_bookings")
      .insert({
        user_id: userId || null,
        name: data.name.trim(),
        phone: data.phone.trim(),
        location: data.location.trim(),
        ritual_type: data.ritualType.trim(),
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime || null,
        language_preference: data.languagePreference.trim(),
        materials_option: data.materialsOption,
        message: data.message?.trim() || null,
        attachment_url: data.attachmentUrl || null,
        status: "new"
      })
      .select()
      .single();

    if (insertError) throw insertError;

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
    return NextResponse.json({ error: err.message || "Failed to submit your request." }, { status: 500 });
  }
}
