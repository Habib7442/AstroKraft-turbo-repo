export const BRAND = "VASTU by Biprangshu";
export const FOUNDER = "Biprangshu Bhattacharjee";
// The fee is ₹1,900. NEXT_PUBLIC_CONSULTATION_FEE overrides it (e.g. 20 for a
// live end-to-end test payment) — remove it after testing. It drives both the
// amount charged (create-order) and every price shown on the page, so a
// forgotten override is visible on the landing page itself.
const DEFAULT_FEE = 1900;
const feeOverride = Number(process.env.NEXT_PUBLIC_CONSULTATION_FEE);
export const CONSULTATION_FEE = Number.isInteger(feeOverride) && feeOverride >= 1 ? feeOverride : DEFAULT_FEE;
export const CONSULTATION_FEE_LABEL = `₹${new Intl.NumberFormat("en-IN").format(CONSULTATION_FEE)}`;

export const CONTACT_PHONE = "6913230255";
export const CONTACT_EMAIL = "vastubipra@gmail.com";
export const WHATSAPP_URL = `https://wa.me/91${CONTACT_PHONE}?text=${encodeURIComponent(
  "Hi, I'd like to know more about the 1:1 Business Vastu Consultation."
)}`;

export const FOUNDER_PHOTO: string | null = "/biprangshu.webp";

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
export const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || "";
export const CAL_ORIGIN = process.env.NEXT_PUBLIC_CAL_ORIGIN || "https://cal.com";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
