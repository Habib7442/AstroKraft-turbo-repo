import { resend } from "@/lib/resend";
import type { PurohitBooking } from "@astrokraft/db";

const SENDER = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const TEAM_NOTIFY_EMAIL = "astrokraftwebsitemanagement@gmail.com";

const MATERIALS_LABEL: Record<PurohitBooking["materials_option"], string> = {
  purohit_only: "Purohit only",
  purohit_and_samagri: "Purohit + Samagri"
};

// Best-effort by design — the caller wraps this in try/catch and never lets
// a failed notification email turn an already-saved booking into an error
// response (AC-4).
export async function sendPurohitBookingEmail(booking: PurohitBooking) {
  const html = `
    <h2>New Purohit Booking Request</h2>
    <p><strong>Name:</strong> ${booking.name}</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Location:</strong> ${booking.location}</p>
    <p><strong>Ritual:</strong> ${booking.ritual_type}</p>
    <p><strong>Preferred Date:</strong> ${booking.preferred_date}${booking.preferred_time ? ` at ${booking.preferred_time}` : ""}</p>
    <p><strong>Language Preference:</strong> ${booking.language_preference}</p>
    <p><strong>Materials:</strong> ${MATERIALS_LABEL[booking.materials_option]}</p>
    ${booking.message ? `<p><strong>Message:</strong> ${booking.message}</p>` : ""}
    ${booking.attachment_url ? `<p><strong>Attachment:</strong> <a href="${booking.attachment_url}">${booking.attachment_url}</a></p>` : ""}
  `;

  const { error } = await resend.emails.send({
    from: SENDER,
    to: TEAM_NOTIFY_EMAIL,
    subject: `New Purohit Booking: ${booking.name} — ${booking.ritual_type}`,
    html
  });

  if (error) {
    throw new Error(typeof error === "object" && "message" in error ? String(error.message) : "Resend send failed");
  }
}
