export const BRAND = "VASTU by Biprangshu";
export const FOUNDER = "Biprangshu Bhattacharjee";
// Two offers share one booking + payment flow: the Flat Vastu page (/) at
// ₹999 and the Business Vastu page (/business-vastu) at ₹1,999. A lead's
// offer is derived from its business_category (see offerForCategory), so the
// amount charged is always decided server-side from the stored lead.
// NEXT_PUBLIC_BUSINESS_CONSULTATION_FEE sets the business price (default
// ₹1,999). NEXT_PUBLIC_CONSULTATION_FEE overrides BOTH fees (e.g. 20 for a
// live end-to-end test payment) — remove it after testing. Fees drive the
// amount charged (create-order) and every price shown, so a forgotten
// override is visible on the landing pages themselves. Both are inlined at
// build time: redeploy after changing them.
const validFee = (value: string | undefined) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
};
const feeOverride = validFee(process.env.NEXT_PUBLIC_CONSULTATION_FEE);
const fee = (amount: number) => feeOverride ?? amount;
const BUSINESS_FEE = validFee(process.env.NEXT_PUBLIC_BUSINESS_CONSULTATION_FEE) ?? 1999;
const inr = (amount: number) => `₹${new Intl.NumberFormat("en-IN").format(amount)}`;

export type OfferId = "flat" | "business";

export type Offer = {
  id: OfferId;
  fee: number;
  feeLabel: string;
  /** Product name shown on the pay page, Razorpay and emails. */
  name: string;
  /** "Book your … Call" */
  callName: string;
  /** What the client sends after paying ("flat" / "business space"). */
  space: string;
  calLink: string;
};

export const FLAT_CATEGORY = "Flat / Apartment";

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || "";

export const OFFERS: Record<OfferId, Offer> = {
  flat: {
    id: "flat",
    fee: fee(999),
    feeLabel: inr(fee(999)),
    name: "Flat Vastu Report + Expert Call",
    callName: "Flat Vastu Call",
    space: "flat",
    calLink: CAL_LINK
  },
  business: {
    id: "business",
    fee: fee(BUSINESS_FEE),
    feeLabel: inr(fee(BUSINESS_FEE)),
    name: "Business Vastu Report + Expert Call",
    callName: "Business Vastu Call",
    space: "business space",
    // Optional separate Cal.com event for business calls; same calendar otherwise.
    calLink: process.env.NEXT_PUBLIC_CAL_LINK_BUSINESS || CAL_LINK
  }
};

/** Flat leads store FLAT_CATEGORY; business leads store their business type. */
export const offerForCategory = (category: string): Offer => OFFERS[category === FLAT_CATEGORY ? "flat" : "business"];

// The Flat Vastu page's fee, used across the home page.
export const CONSULTATION_FEE = OFFERS.flat.fee;
export const CONSULTATION_FEE_LABEL = OFFERS.flat.feeLabel;

export const CONTACT_PHONE = "6001730761";
export const CONTACT_EMAIL = "vastubipra@gmail.com";
export const whatsappLink = (text: string) => `https://wa.me/91${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;
export const WHATSAPP_URL = whatsappLink("Hi, I'd like to know more about the Flat Vastu Report + Expert Call.");
export const BUSINESS_WHATSAPP_URL = whatsappLink("Hi, I'd like to know more about the Business Vastu consultation.");

export const FOUNDER_PHOTO: string | null = "/biprangshu-office.webp";

export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@vastubiprangshu";

/**
 * Videos shown in the "Client stories & site visits" section, in display
 * order. To add one: upload it (public, embedding allowed) and add its ID —
 * the part after /shorts/ or ?v= in the YouTube link. The section is hidden
 * while this list is empty.
 */
export const VIDEOS: { id: string; title: string; tag: "Client feedback" | "Site visit" | "Consultation" }[] = [
  { id: "RDVv-tSTgkQ", title: "Mr. K. Ganatra, Ahmedabad", tag: "Client feedback" },
  { id: "gDZiINDc8vQ", title: "Construction site, Udaipur, Tripura", tag: "Site visit" },
  { id: "gJibaChdkoo", title: "When Vastu meets Tollywood", tag: "Consultation" },
  { id: "v7XYc6gYd1s", title: "How an on-site consultation works", tag: "Site visit" }
];

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
export const CAL_ORIGIN = process.env.NEXT_PUBLIC_CAL_ORIGIN || "https://cal.com";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
