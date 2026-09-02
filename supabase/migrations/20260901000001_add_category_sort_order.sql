-- ========================================================
-- Migration: Add sort_order to Categories
-- ========================================================
ALTER TABLE public.categories
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with a stable order based on name so nothing
-- collapses to the same position.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) - 1 AS rn
  FROM public.categories
)
UPDATE public.categories c
SET sort_order = ordered.rn
FROM ordered
WHERE c.id = ordered.id;

CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
