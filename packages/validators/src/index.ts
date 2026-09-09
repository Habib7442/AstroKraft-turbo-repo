import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, "Review must be at least 5 characters"),
  productId: z.string().uuid("A valid product is required")
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  line1: z.string().min(5, "Address line 1 required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode required")
});

export type AddressInput = z.infer<typeof addressSchema>;

export const purohitBookingSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  location: z.string().min(5, "Location is required"),
  ritualType: z.string().min(2, "Ritual type is required"),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A valid preferred date is required"),
  preferredTime: z.string().optional(),
  languagePreference: z.string().min(2, "Language preference is required"),
  materialsOption: z.enum(["purohit_only", "purohit_and_samagri"]),
  message: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  // Hidden honeypot field: a real visitor never fills this in. A bot that
  // does gets a normal-looking success response but no row is written.
  website: z.string().optional()
});

export type PurohitBookingInput = z.infer<typeof purohitBookingSchema>;
