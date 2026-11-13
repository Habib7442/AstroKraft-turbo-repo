import { CONTACT_PHONE, whatsappLink } from "./site";

// Settings for the ₹199 live group intro session of the Astro Vastu Masterclass
// (/vastu-masterclass and its thank-you page). Everything that changes per
// batch is an env var (inlined at build time — redeploy after changing):
//   NEXT_PUBLIC_WORKSHOP_DATE  session start, ISO with offset, e.g. 2026-11-23T19:00:00+05:30
//   NEXT_PUBLIC_WORKSHOP_FEE   whole rupees, default 199 — also the amount Razorpay charges
// Without a date the pages say the date is shared on WhatsApp rather than
// inventing one.

const envFee = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};
const inr = (amount: number) => `₹${new Intl.NumberFormat("en-IN").format(amount)}`;

export const WORKSHOP_FEE = envFee(process.env.NEXT_PUBLIC_WORKSHOP_FEE, 199);
export const WORKSHOP_FEE_LABEL = inr(WORKSHOP_FEE);
export const WORKSHOP_WAS_LABEL = inr(999);

const rawDate = process.env.NEXT_PUBLIC_WORKSHOP_DATE;
const date = rawDate ? new Date(rawDate) : null;
const validDate = date && !Number.isNaN(date.getTime()) ? date : null;

/** e.g. "Sun, 23 Nov 2026 · 7:00 pm IST", or null when no date is configured. */
export const WORKSHOP_DATE_LABEL = validDate
  ? `${new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(validDate)} · ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(validDate)} IST`
  : null;

export const WORKSHOP_WHATSAPP_URL = whatsappLink("Hi, I'd like to join the Astro Vastu Masterclass intro session.");
export const WORKSHOP_WHATSAPP_DISPLAY = `+91 ${CONTACT_PHONE.slice(0, 5)} ${CONTACT_PHONE.slice(5)}`;
