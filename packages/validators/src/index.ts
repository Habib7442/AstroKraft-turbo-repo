import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(2, "Title is required"),
  body: z.string().min(5, "Review must be at least 5 characters"),
  productId: z.string().optional(),
  astrologerId: z.string().optional()
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
