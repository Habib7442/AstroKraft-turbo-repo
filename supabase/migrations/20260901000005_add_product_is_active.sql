-- ========================================================
-- Migration: Add is_active toggle to Products
-- ========================================================
ALTER TABLE public.products
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Replace the fully-public read policy with one that hides disabled
-- products from customers while admins can still see everything
-- (needed so the admin app can list and re-enable hidden products).
DROP POLICY "Public read products" ON public.products;

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = true OR public.is_admin());
