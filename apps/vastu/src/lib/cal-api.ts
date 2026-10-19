import "server-only";

// The event type has "Requires confirmation" on, so a new booking sits
// unconfirmed (and Cal.com sends no confirmation SMS/email) until it is paid.
// Once Razorpay payment is verified we confirm it here, which makes Cal.com
// send the confirmation and put it on the calendar as accepted.
const CAL_API_URL = process.env.CAL_API_URL || "https://api.cal.com/v2";

/** Never throws: a failed confirm is logged and the team can confirm by hand in Cal.com. */
export async function confirmCalBooking(bookingUid: string): Promise<boolean> {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) {
    console.error("CAL_API_KEY not set — cannot auto-confirm paid booking", bookingUid);
    return false;
  }
  try {
    const res = await fetch(`${CAL_API_URL}/bookings/${encodeURIComponent(bookingUid)}/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "cal-api-version": "2024-08-13" }
    });
    if (!res.ok) console.error("Cal.com confirm failed:", bookingUid, res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error("Cal.com confirm failed:", bookingUid, error);
    return false;
  }
}
