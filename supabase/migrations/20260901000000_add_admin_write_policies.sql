-- ========================================================
-- Migration: Admin Write Policies for Categories, Products, Variants
-- ========================================================
-- These tables previously had public-read-only policies with no INSERT/
-- UPDATE/DELETE policy at all, so the admin app's catalog screens were
-- silently rejected by RLS (mirrors the same gap already fixed for
-- promo_banners).

CREATE POLICY "Admins insert categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update categories" ON public.categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete categories" ON public.categories
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update products" ON public.products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete products" ON public.products
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins insert product variants" ON public.product_variants
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins update product variants" ON public.product_variants
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins delete product variants" ON public.product_variants
  FOR DELETE USING (public.is_admin());
