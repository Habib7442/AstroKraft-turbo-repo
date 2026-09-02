-- ========================================================
-- Migration: Add is_active toggle to Categories
-- ========================================================
ALTER TABLE public.categories
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Replace the fully-public read policy with one that hides disabled
-- categories from customers while admins can still see everything
-- (needed so the admin app can list and re-enable hidden categories).
DROP POLICY "Public read categories" ON public.categories;

CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());
