-- ========================================================
-- Migration: Add Website & Mobile Promo Banners Table
-- ========================================================

CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL, -- R2 Image URL uploaded by Admin
  mobile_image_url TEXT,  -- Optional responsive mobile banner URL
  link_url TEXT,          -- Optional link destination (e.g. /en/gemstones/ruby)
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for ordering active banners
CREATE INDEX IF NOT EXISTS idx_promo_banners_active ON public.promo_banners(is_active, position);

-- Enable RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read active promo banners" ON public.promo_banners
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins insert promo banners" ON public.promo_banners
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update promo banners" ON public.promo_banners
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete promo banners" ON public.promo_banners
  FOR DELETE USING (public.is_admin());
