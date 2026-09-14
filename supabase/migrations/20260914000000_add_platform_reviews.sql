-- ========================================================
-- Migration: Public platform testimonials (no sign-in required)
-- ========================================================
-- Distinct from public.reviews (product reviews, tied to a signed-in buyer)
-- - this is a general "how was your experience with AstroKraft" testimonial
-- anyone can leave without an account, moderated before going public, same
-- pending/approved/rejected lifecycle as product reviews.

CREATE TABLE public.platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_reviews_status ON public.platform_reviews(status);

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Inserts go through /api/platform-reviews using the service-role client
-- (same pattern as product reviews and purohit bookings) - no public INSERT
-- policy needed, and this deliberately does NOT allow one, since there's no
-- signed-in user here to attribute a write to or rate-limit by.
CREATE POLICY "Public read approved platform reviews" ON public.platform_reviews
  FOR SELECT USING (status = 'approved' OR public.is_admin());

CREATE POLICY "Admins update platform reviews" ON public.platform_reviews
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete platform reviews" ON public.platform_reviews
  FOR DELETE USING (public.is_admin());
