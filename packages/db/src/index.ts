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
  consent_notice_version?: string | null;
  consented_at?: string | null;
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

// A general "how was your experience with AstroKraft" testimonial, distinct
// from Review (which is always a signed-in buyer reviewing one product) -
// anyone can leave one without an account, moderated before going public.
export interface PlatformReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  // Not shown publicly - used server-side to rate-limit submissions (there's
  // no signed-in user or phone/email to key on), and surfaced to admins for
  // moderation context (spotting several "different" names spamming from
  // the same IP).
  submitter_ip?: string | null;
  consent_notice_version?: string | null;
  consented_at?: string | null;
  created_at: string;
}

export interface Consultation {
  id: string;
  user_id?: string;
  astrologer_id?: string;
  category_id?: string;
  astrologer_name?: string;
  customer_name?: string;
  customer_phone?: string;
  slot_timestamp: string;
  kundli_details: Record<string, unknown>;
  status: "payment_pending" | "payment_failed" | "booked" | "completed" | "cancelled" | "no_show";
  meeting_link?: string;
  amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  consent_notice_version?: string | null;
  consented_at?: string | null;
  created_at: string;
}

export interface PurohitBooking {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  location: string;
  ritual_type: string;
  preferred_date: string;
  preferred_time?: string;
  language_preference: string;
  materials_option: "purohit_only" | "purohit_and_samagri";
  message?: string;
  // R2 object key under purohit-uploads/, never a URL — the object is
  // private. Admins get a short-lived signed download URL from the
  // r2-presign-download edge function, on demand.
  attachment_key?: string;
  status: "new" | "contacted" | "confirmed" | "completed" | "cancelled";
  consent_notice_version?: string | null;
  consented_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  // Which Android notification channel this device last confirmed it has
  // created; null on iOS or for a token registered before this column
  // existed. The send-push helper falls back to "default" when null so it
  // never targets a channel the device might not have.
  channel_id?: string | null;
  created_at: string;
}

export interface ConsultationCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  // Booking no longer lets the customer pick a specific astrologer (an
  // admin assigns one afterward), so price is set per category rather than
  // read off any one astrologer's own rate.
  price?: number;
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

export type BlogEmbedProvider = "youtube" | "facebook" | "instagram";

export interface BlogImage {
  url: string; // Cloudflare R2 uploaded image URL
  alt: string;
  caption?: string;
}

/** One block of a blog post body, stored in order in `blog_posts.content`. */
export type BlogBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string } // supports **bold**, *italic*, [label](url)
  | { type: "list"; style: "bullet" | "number"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "images"; images: BlogImage[] }
  | { type: "embed"; provider: BlogEmbedProvider; url: string; caption?: string };

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string; // also the OG / Twitter share image
  cover_image_alt: string;
  content: BlogBlock[];
  faqs: BlogFaq[];
  tags: string[];
  author_name: string;
  seo_title?: string | null;
  seo_description?: string | null;
  status: "draft" | "published";
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type VastuLeadStatus = "lead" | "booked" | "rescheduled" | "cancelled" | "completed" | "no_show";
export type VastuPaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type VastuFollowUpStatus = "pending" | "contacted" | "interested_premium" | "not_interested" | "converted";

/** One row per prospect from the VASTU by Biprangshu landing page (apps/vastu). */
export interface VastuLead {
  id: string;
  full_name: string;
  whatsapp: string;
  city: string;
  state: string;
  business_category: string;
  business_stage: "existing" | "new" | "expansion";
  problems: string[];
  /** null = the optional booking-form question was skipped. */
  floor_plan_available: boolean | null;
  status: VastuLeadStatus;
  follow_up_status: VastuFollowUpStatus;
  premium_interest: boolean;
  admin_notes?: string | null;
  cal_booking_uid?: string | null;
  cal_booking_id?: number | null;
  attendee_email?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  amount_paid?: number | null;
  paid_at?: string | null;
  payment_status: VastuPaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  meeting_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  last_cal_event?: string | null;
  cal_payload?: Record<string, unknown> | null;
  consent_notice_version?: string | null;
  consented_at?: string | null;
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

export const DB_SCHEMA_VERSION = "2.4.0";
