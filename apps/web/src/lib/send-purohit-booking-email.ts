import { resend } from "@/lib/resend";
import type { PurohitBooking } from "@astrokraft/db";

const SENDER = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const TEAM_NOTIFY_EMAIL = "astrokraftwebsitemanagement@gmail.com";

const MATERIALS_LABEL: Record<PurohitBooking["materials_option"], string> = {
  purohit_only: "Purohit only",
  purohit_and_samagri: "Purohit + Samagri"
};

// Every field below except MATERIALS_LABEL's value is public form input —
// the booking route validates length/format, not HTML content, so a caller
// can submit markup (e.g. a fake "Attachment" link, or content that alters
// how the notification reads) unless every interpolated value is escaped.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Best-effort by design — the caller wraps this in try/catch and never lets
// a failed notification email turn an already-saved booking into an error
// response (AC-4).
export async function sendPurohitBookingEmail(booking: PurohitBooking) {
  const html = `
    <h2>New Purohit Booking Request</h2>
    <p><strong>Name:</strong> ${escapeHtml(booking.name)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>
    <p><strong>Location:</strong> ${escapeHtml(booking.location)}</p>
    <p><strong>Ritual:</strong> ${escapeHtml(booking.ritual_type)}</p>
    <p><strong>Preferred Date:</strong> ${escapeHtml(booking.preferred_date)}${booking.preferred_time ? ` at ${escapeHtml(booking.preferred_time)}` : ""}</p>
    <p><strong>Language Preference:</strong> ${escapeHtml(booking.language_preference)}</p>
    <p><strong>Materials:</strong> ${MATERIALS_LABEL[booking.materials_option]}</p>
    ${booking.message ? `<p><strong>Message:</strong> ${escapeHtml(booking.message)}</p>` : ""}
    ${booking.attachment_key ? `<p><strong>Attachment:</strong> submitted — open this booking in the admin app to view it.</p>` : ""}
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
