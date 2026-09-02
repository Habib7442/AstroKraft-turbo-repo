-- ========================================================
-- AstroKraft Monorepo Database Schema Migration
-- Standardized Postgres Schema for Vedic D2C & Operations
-- Compatible with Clerk Auth (auth.jwt() ->> 'sub')
-- Includes Website & Mobile Promo Banners
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop legacy conflicting tables if any
DROP TABLE IF EXISTS public.promo_banners CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.consultations CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- --------------------------------------------------------
-- 1. Profiles Table (Synced with Clerk Auth Users)
-- --------------------------------------------------------
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, -- Clerk User ID (e.g. user_2I...)
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. Categories Table
-- --------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 3. Products Table (Gemstones, Rudraksha, Vastu)
-- --------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  badge TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 4. Product Variants Table (Carat, Origin, Lab Certificates)
-- --------------------------------------------------------
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  carat_weight NUMERIC(5,2),
  origin TEXT,
  certification_url TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 5. Orders Table (Razorpay & Order State Machine)
-- --------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'payment_pending', 'paid', 'payment_failed', 'processing', 'shipped', 'delivered', 'refund_requested', 'refunded', 'cancelled')
  ),
  total_amount NUMERIC(10,2) NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 6. Order Items Table
-- --------------------------------------------------------
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 7. Reviews Table (Moderation Queue)
-- --------------------------------------------------------
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_verified_buyer BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 8. Consultations Table (Astrologer Bookings)
-- --------------------------------------------------------
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  astrologer_name TEXT NOT NULL,
  slot_timestamp TIMESTAMPTZ NOT NULL,
  kundli_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 9. Promo Banners Table (Website & Mobile Carousels)
-- --------------------------------------------------------
CREATE TABLE public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL, -- R2 Image URL uploaded by Admin
  mobile_image_url TEXT,  -- Optional responsive mobile banner URL
  link_url TEXT,          -- Optional link (e.g. /en/gemstones/ruby or custom target)
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- Indexes for High Performance
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_banners_active ON public.promo_banners(is_active, position);

-- --------------------------------------------------------
-- Enable Row Level Security (RLS) across all tables
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- RLS Policies (Clerk User ID Compatible via auth.jwt())
-- --------------------------------------------------------

-- Helper function to check if current Clerk user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles Policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'sub') = id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = id);

-- Categories & Products: Public read
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Public read product variants" ON public.product_variants
  FOR SELECT USING (true);

-- Orders: Users read/insert own orders; admins manage all
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id OR public.is_admin());

CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR user_id IS NULL);

-- Order Items: Users read own order items
CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = (auth.jwt() ->> 'sub') OR public.is_admin())
    )
  );

-- Reviews: Public read approved reviews; users insert own reviews
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved' OR (auth.jwt() ->> 'sub') = user_id OR public.is_admin());

CREATE POLICY "Users insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Consultations: Users read own consultations; admins manage all
CREATE POLICY "Users read own consultations" ON public.consultations
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id OR public.is_admin());

CREATE POLICY "Users insert own consultations" ON public.consultations
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Promo Banners: Public read active banners; admins manage all
CREATE POLICY "Public read active promo banners" ON public.promo_banners
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins insert promo banners" ON public.promo_banners
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update promo banners" ON public.promo_banners
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete promo banners" ON public.promo_banners
  FOR DELETE USING (public.is_admin());
