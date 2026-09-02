-- ========================================================
-- Migration: Consultation Categories + Astrologers
-- ========================================================

-- --------------------------------------------------------
-- 1. Consultation Categories (Career & Business, Love & Marriage, etc.)
-- --------------------------------------------------------
CREATE TABLE public.consultation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT, -- emoji shown in the circular badge
  color TEXT, -- pastel card background hex, matches the storefront design
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_categories_sort_order ON public.consultation_categories(sort_order);

-- --------------------------------------------------------
-- 2. Astrologers
-- --------------------------------------------------------
CREATE TABLE public.astrologers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  bio TEXT,
  experience_years INTEGER,
  languages TEXT[] DEFAULT '{}',
  price NUMERIC(10,2),
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  review_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_astrologers_sort_order ON public.astrologers(sort_order);

-- --------------------------------------------------------
-- 3. Astrologer <-> Consultation Category (many-to-many expertise)
-- --------------------------------------------------------
CREATE TABLE public.astrologer_categories (
  astrologer_id UUID NOT NULL REFERENCES public.astrologers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.consultation_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (astrologer_id, category_id)
);

CREATE INDEX idx_astrologer_categories_astrologer ON public.astrologer_categories(astrologer_id);
CREATE INDEX idx_astrologer_categories_category ON public.astrologer_categories(category_id);

-- --------------------------------------------------------
-- 4. RLS — same public-read-active / admin-write pattern as products & categories
-- --------------------------------------------------------
ALTER TABLE public.consultation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrologers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrologer_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active consultation categories" ON public.consultation_categories
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins insert consultation categories" ON public.consultation_categories
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update consultation categories" ON public.consultation_categories
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete consultation categories" ON public.consultation_categories
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Public read active astrologers" ON public.astrologers
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins insert astrologers" ON public.astrologers
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update astrologers" ON public.astrologers
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete astrologers" ON public.astrologers
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Public read astrologer categories" ON public.astrologer_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins insert astrologer categories" ON public.astrologer_categories
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete astrologer categories" ON public.astrologer_categories
  FOR DELETE USING (public.is_admin());

-- --------------------------------------------------------
-- 5. Seed the 6 launch categories (matches the existing storefront design)
-- --------------------------------------------------------
INSERT INTO public.consultation_categories (name, slug, icon, color, sort_order) VALUES
  ('Career & Business', 'career-business', '💼', '#FCE7B0', 0),
  ('Love & Marriage', 'love-marriage', '💗', '#E4DBFA', 1),
  ('Finance & Wealth', 'finance-wealth', '🪙', '#FBD5CC', 2),
  ('Health & Well-Being', 'health-well-being', '💓', '#D3F3DE', 3),
  ('Kundli Guidance', 'kundli-guidance', '📜', '#FCEE9E', 4),
  ('Education & Studies', 'education-studies', '🎓', '#D6ECFB', 5);
