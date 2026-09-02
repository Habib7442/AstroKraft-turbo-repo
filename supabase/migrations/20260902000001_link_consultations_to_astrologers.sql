-- ========================================================
-- Migration: Link consultations to astrologers/categories + admin write access
-- ========================================================

-- Link bookings to the real astrologer/category records (nullable so existing
-- rows and legacy free-text astrologer_name entries keep working).
ALTER TABLE public.consultations
  ADD COLUMN astrologer_id UUID REFERENCES public.astrologers(id) ON DELETE SET NULL,
  ADD COLUMN category_id UUID REFERENCES public.consultation_categories(id) ON DELETE SET NULL,
  ADD COLUMN customer_name TEXT,
  ADD COLUMN customer_phone TEXT;

CREATE INDEX idx_consultations_astrologer ON public.consultations(astrologer_id);
CREATE INDEX idx_consultations_slot ON public.consultations(slot_timestamp);

-- The original migration only let a signed-in user insert their OWN booking,
-- and had no update/delete policy for anyone at all — meaning admins could
-- not previously create, edit, or cancel a consultation through RLS.
CREATE POLICY "Admins insert consultations" ON public.consultations
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update consultations" ON public.consultations
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete consultations" ON public.consultations
  FOR DELETE USING (public.is_admin());
