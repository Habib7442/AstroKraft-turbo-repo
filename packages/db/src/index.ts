import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string; // Clerk User ID (auth.jwt() ->> 'sub')
  role: "customer" | "admin";
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category_id?: string;
  badge?: string;
  is_featured: boolean;
  is_active: boolean;
  emi_available: boolean;
  sort_order: number;
  rating: number;
  review_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

export type ProductQuality = "basic" | "semi_prem" | "premium";

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  quality?: ProductQuality;
  carat_weight?: number;
  origin?: string;
  certification_url?: string;
  price: number;
  original_price?: number;
  stock: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  status:
    | "created"
    | "payment_pending"
    | "paid"
    | "payment_failed"
    | "processing"
    | "shipped"
    | "delivered"
    | "refund_requested"
    | "refunded"
    | "cancelled";
  total_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  shipping_address: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Consultation {
  id: string;
  user_id?: string;
  astrologer_id?: string;
  category_id?: string;
  astrologer_name: string;
  customer_name?: string;
  customer_phone?: string;
  slot_timestamp: string;
  kundli_details: Record<string, unknown>;
  status: "payment_pending" | "payment_failed" | "booked" | "completed" | "cancelled" | "no_show";
  meeting_link?: string;
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
}

export interface ConsultationCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Astrologer {
  id: string;
  name: string;
  slug: string;
  photo_url?: string;
  bio?: string;
  experience_years?: number;
  languages: string[];
  price?: number;
  rating: number;
  review_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AstrologerCategory {
  astrologer_id: string;
  category_id: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string; // Cloudflare R2 uploaded image URL
  mobile_image_url?: string; // Optional mobile responsive banner URL
  link_url?: string; // Optional destination link
  is_active: boolean;
  position: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------
// Native Clerk + Supabase Integration Client Helpers
// --------------------------------------------------------

/**
 * Standard Supabase client (Anon / Public access)
 */
export function createSupabaseClient(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * React / Next.js Client-side Supabase client authenticated via Clerk Session Token
 */
export function createClerkSupabaseClient(
  session: { getToken: () => Promise<string | null> } | null | undefined,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return (await session?.getToken()) ?? null;
    }
  });
}

export const DB_SCHEMA_VERSION = "2.2.0";
