-- ========================================================
-- Migration: Add sort_order to Products
-- ========================================================
ALTER TABLE public.products
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with a stable order based on current created_at
-- ordering so nothing collapses to the same position.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM public.products
)
UPDATE public.products p
SET sort_order = ordered.rn
FROM ordered
WHERE p.id = ordered.id;

CREATE INDEX idx_products_sort_order ON public.products(sort_order);
