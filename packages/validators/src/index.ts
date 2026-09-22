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
