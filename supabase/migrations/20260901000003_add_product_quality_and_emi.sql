-- ========================================================
-- Migration: Product Quality Tiers & EMI Availability
-- ========================================================

-- Quality tier per variant (basic / semi_prem / premium), nullable for
-- products that don't use tiered pricing.
ALTER TABLE public.product_variants
  ADD COLUMN quality TEXT CHECK (quality IN ('basic', 'semi_prem', 'premium'));

-- Per-product EMI availability (Bajaj Finserv Cardless EMI eligibility).
ALTER TABLE public.products
  ADD COLUMN emi_available BOOLEAN NOT NULL DEFAULT false;
