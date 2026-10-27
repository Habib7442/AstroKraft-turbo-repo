import { z } from "zod";

// The regex only checks the shape (4 digits, 2 digits, 2 digits) — it
// accepts calendar-impossible values like 2026-02-30 just as happily as a
// real date. Postgres' DATE column rejects those at insert time, which
// without this check surfaces as a 500 instead of the intended 400
// validation response. Constructing a UTC date and reading its fields back
// out catches the mismatch: Date.UTC normalizes an out-of-range day/month
// (Feb 30 becomes Mar 2) instead of throwing, so the round-trip comparison
// is what actually detects it.
export function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Bump whenever the privacy policy's substance changes, and keep it in step
// with the policy page's "Last updated" date. Stored on every row created
// under consent, as proof of which notice the person accepted.
export const PRIVACY_NOTICE_VERSION = "2026-10-03";

const consentAccepted = z.literal(true, {
  errorMap: () => ({ message: "Please confirm you are 18 or older and accept the Privacy Policy." })
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  // .trim() must run before .min() — otherwise a whitespace-only string
  // (e.g. 5 spaces) passes the length check and only becomes empty later,
  // after validation, when the route trims it before storing.
  comment: z.string().trim().min(5, "Review must be at least 5 characters"),
  productId: z.string().uuid("A valid product is required")
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// A general platform testimonial, submittable without an account - name is
// free text (there's no signed-in user to attribute it to), so it needs its
// own minimum-length check the way a Clerk-verified name wouldn't.
export const platformReviewSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100, "Name is too long"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Review must be at least 10 characters").max(2000, "Review is too long"),
  consent: consentAccepted,
  // Hidden honeypot field: a real visitor never fills this in. A bot that
  // does gets a normal-looking success response but no row is written.
  website: z.string().optional()
});

export type PlatformReviewInput = z.infer<typeof platformReviewSchema>;

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(10, "Valid phone number required"),
  line1: z.string().trim().min(5, "Address line 1 required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().min(6, "Valid pincode required")
});

export type AddressInput = z.infer<typeof addressSchema>;

export const purohitBookingSchema = z.object({
  // .trim() must run before .min() on every required field below —
  // otherwise a whitespace-only value (e.g. 10 spaces for phone) passes the
  // length check here and only becomes empty later, after validation, when
  // the create route trims it before storing — leaving a lead the team has
  // no name/phone/location to act on.
  name: z.string().trim().min(2, "Name is required"),
  phone: z.string().trim().min(10, "Valid phone number required"),
  location: z.string().trim().min(5, "Location is required"),
  ritualType: z.string().trim().min(2, "Ritual type is required"),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "A valid preferred date is required")
    .refine(isValidCalendarDate, "A valid preferred date is required"),
  // Same failure class as preferredDate above: with no format check, a
  // caller posting e.g. "later today" hits Postgres' TIME cast at insert
  // time instead of failing validation here — a 500 instead of a 400.
  preferredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "A valid preferred time is required")
    .optional(),
  languagePreference: z.string().trim().min(2, "Language preference is required"),
  materialsOption: z.enum(["purohit_only", "purohit_and_samagri"]),
  message: z.string().optional(),
  // The R2 object key minted by /api/purohit-bookings/upload-url — never a
  // full URL. Attachments are private (customer documents, not public
  // assets), so the client only ever handles the key; a signed download URL
  // is minted separately, on demand, for an authenticated admin.
  attachmentKey: z
    .string()
    .max(500)
    .regex(/^purohit-uploads\//, "Invalid attachment reference")
    .optional(),
  consent: consentAccepted,
  // Hidden honeypot field: a real visitor never fills this in. A bot that
  // does gets a normal-looking success response but no row is written.
  website: z.string().optional()
});

export type PurohitBookingInput = z.infer<typeof purohitBookingSchema>;

// Bounding box for the bundled India city dataset (public/data/in-cities.json)
// - the kundli/gemstone tools assume Asia/Kolkata (IST, UTC+5:30, no DST) for
// every birthplace, which only holds for Indian coordinates. Generous margin
// around India's actual extent (6.5-37.6N, 68.1-97.4E) rather than a tight
// box, so a coastal/border town never gets wrongly rejected.
export const kundliInputSchema = z.object({
  name: z.string().trim().max(100).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth")
    .refine(isValidCalendarDate, "Enter a valid date of birth"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time (HH:MM)"),
  place: z.string().trim().min(1, "Enter your place of birth").max(150),
  latitude: z.number().min(6, "Only Indian birthplaces are currently supported").max(38),
  longitude: z.number().min(68, "Only Indian birthplaces are currently supported").max(98)
});

export type KundliInput = z.infer<typeof kundliInputSchema>;

// ---------------------------------------------------------------------------
// VASTU by Biprangshu — consultation intake (apps/vastu)
// ---------------------------------------------------------------------------
// Separate brand from AstroKraft, so it carries its own notice version. Bump
// with any substantive change to apps/vastu's /policies page.
export const VASTU_PRIVACY_NOTICE_VERSION = "2026-10-19";

export const VASTU_BUSINESS_CATEGORIES = [
  "Jewellery Showroom",
  "Retail Shop",
  "Hotel",
  "Restaurant / Cafe",
  "Factory / Manufacturing",
  "Builder / Real Estate",
  "Office",
  "Clinic / Hospital",
  "Other"
] as const;

export const VASTU_BUSINESS_STAGES = ["existing", "new", "expansion"] as const;

export const VASTU_BUSINESS_PROBLEMS = [
  "Sales",
  "Cash flow",
  "Expansion",
  "Staff / workplace issues",
  "Partnership issues",
  "Business stagnation",
  "Other"
] as const;

export const vastuLeadSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  // Indian mobile, optionally prefixed with +91 / 91 / 0. Normalized to
  // +91XXXXXXXXXX by the API route before it is stored or sent to Cal.com,
  // whose SMS workflows need E.164.
  // Separators people commonly type ("98765 43210", "+91 98765-43210",
  // "(98765) 43210") are stripped before the check.
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^(?:\+?91|0)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  businessCategory: z.enum(VASTU_BUSINESS_CATEGORIES, {
    errorMap: () => ({ message: "Choose your business category" })
  }),
  businessStage: z.enum(VASTU_BUSINESS_STAGES, {
    errorMap: () => ({ message: "Choose existing, new or expansion" })
  }),
  problems: z.array(z.enum(VASTU_BUSINESS_PROBLEMS)).min(1, "Pick at least one problem").max(VASTU_BUSINESS_PROBLEMS.length),
  floorPlanAvailable: z.boolean(),
  consent: consentAccepted,
  // Attribution captured from the ad click's landing URL / Meta cookies.
  attribution: z
    .object({
      utm_source: z.string().max(200).optional(),
      utm_medium: z.string().max(200).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
      fbclid: z.string().max(500).optional(),
      fbp: z.string().max(200).optional(),
      fbc: z.string().max(600).optional()
    })
    .default({}),
  // Honeypot — see purohitBookingSchema.
  website: z.string().optional()
});

export type VastuLeadInput = z.infer<typeof vastuLeadSchema>;

export function normalizeIndianMobile(value: string): string {
  return `+91${value.replace(/\D/g, "").slice(-10)}`;
}

// --------------------------------------------------------
// Blog (authored in apps/admin, rendered at /en/blog)
// --------------------------------------------------------

export const BLOG_EMBED_PROVIDERS = ["youtube", "facebook", "instagram"] as const;
export type BlogEmbedProviderId = (typeof BLOG_EMBED_PROVIDERS)[number];

export interface ParsedVideoEmbed {
  provider: BlogEmbedProviderId;
  /** The only iframe src the storefront ever renders - always rebuilt from the parsed id, never taken from the stored URL. */
  embedSrc: string;
  orientation: "landscape" | "portrait";
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Turns a pasted YouTube / Facebook / Instagram link into a safe iframe src.
 * Returns null for anything that isn't a recognised video/post URL on one of
 * those hosts, so a stored URL can never point an iframe somewhere else.
 */
export function parseVideoEmbed(rawUrl: string): ParsedVideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    let id: string | undefined;
    let orientation: ParsedVideoEmbed["orientation"] = "landscape";
    if (host === "youtu.be") {
      id = segments[0];
    } else if (segments[0] === "watch") {
      id = url.searchParams.get("v") ?? undefined;
    } else if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
      id = segments[1];
      if (segments[0] === "shorts") orientation = "portrait";
    }
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return { provider: "youtube", embedSrc: `https://www.youtube-nocookie.com/embed/${id}`, orientation };
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    const kind = segments[0] === "reels" ? "reel" : segments[0];
    const code = segments[1];
    if (!kind || !["p", "reel", "tv"].includes(kind) || !code || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    return { provider: "instagram", embedSrc: `https://www.instagram.com/${kind}/${code}/embed`, orientation: "portrait" };
  }

  if (FACEBOOK_HOSTS.has(host)) {
    const isVideo =
      host === "fb.watch" ||
      segments.includes("videos") ||
      segments[0] === "watch" ||
      segments[0] === "reel" ||
      (segments[0] === "share" && (segments[1] === "v" || segments[1] === "r"));
    if (!isVideo) return null;
    const isReel = segments[0] === "reel" || (segments[0] === "share" && segments[1] === "r");
    const href = `https://www.facebook.com${url.pathname}${segments[0] === "watch" ? url.search : ""}`;
    return {
      provider: "facebook",
      embedSrc: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        host === "fb.watch" ? url.href : href
      )}&show_text=false`,
      orientation: isReel ? "portrait" : "landscape"
    };
  }

  return null;
}

/** "Which Finger to Wear Blue Sapphire?" -> "which-finger-to-wear-blue-sapphire" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

const blogText = (max: number) => z.string().trim().min(1, "This field can't be empty").max(max);
const httpsUrl = z.string().trim().url("Must be a valid URL").startsWith("https://", "Must be an https:// URL");

export const blogImageSchema = z.object({
  url: httpsUrl,
  alt: z.string().trim().min(3, "Every image needs alt text (describe what it shows)").max(200),
  caption: z.string().trim().max(300).optional()
});

export const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: blogText(200) }),
  z.object({ type: z.literal("paragraph"), text: blogText(10000) }),
  z.object({
    type: z.literal("list"),
    style: z.enum(["bullet", "number"]),
    items: z.array(blogText(1000)).min(1, "A list needs at least one item").max(50)
  }),
  z.object({ type: z.literal("quote"), text: blogText(1000), cite: z.string().trim().max(200).optional() }),
  z.object({ type: z.literal("images"), images: z.array(blogImageSchema).min(1, "Add at least one image").max(12) }),
  // discriminatedUnion members can't carry .refine(), so the URL is checked
  // on its own here and the provider match on the content array below.
  z.object({
    type: z.literal("embed"),
    provider: z.enum(BLOG_EMBED_PROVIDERS),
    url: httpsUrl.refine((url) => parseVideoEmbed(url) !== null, {
      message: "Paste a YouTube, Facebook video/reel, or Instagram post/reel link"
    }),
    caption: z.string().trim().max(300).optional()
  })
]);

export const blogFaqSchema = z.object({
  question: blogText(300),
  answer: blogText(2000)
});

const blogPostFields = {
  slug: z
    .string()
    .trim()
    .min(3, "URL slug is too short")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only"),
  title: blogText(200),
  faqs: z.array(blogFaqSchema).max(20).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  author_name: z.string().trim().min(2).max(100).default("AstroKraft"),
  seo_title: z.string().trim().max(70, "SEO title should be 70 characters or fewer").nullable().optional(),
  seo_description: z.string().trim().max(170, "SEO description should be 170 characters or fewer").nullable().optional()
};

// A draft only needs a title and slug - everything else may be half-written,
// and its blocks are not validated until publish (the storefront never reads
// drafts).
export const blogDraftSchema = z.object({
  ...blogPostFields,
  status: z.literal("draft"),
  excerpt: z.string().trim().max(300),
  cover_image_url: z.union([httpsUrl, z.literal("")]),
  cover_image_alt: z.string().trim().max(200),
  content: z.array(z.object({ type: z.string() }).passthrough()).max(150)
});

export const blogPublishSchema = z.object({
  ...blogPostFields,
  status: z.literal("published"),
  excerpt: z.string().trim().min(50, "Write at least 50 characters - this is the Google snippet").max(300),
  cover_image_url: httpsUrl,
  cover_image_alt: z.string().trim().min(3, "Cover image needs alt text").max(200),
  content: z
    .array(blogBlockSchema)
    .min(1, "Add at least one section to the post")
    .max(150)
    .superRefine((blocks, ctx) => {
      blocks.forEach((block, index) => {
        if (block.type === "embed" && parseVideoEmbed(block.url)?.provider !== block.provider) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Embed link doesn't match its provider", path: [index, "url"] });
        }
      });
    })
});

export const blogPostSchema = z.discriminatedUnion("status", [blogDraftSchema, blogPublishSchema]);

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type BlogBlockInput = z.infer<typeof blogBlockSchema>;
