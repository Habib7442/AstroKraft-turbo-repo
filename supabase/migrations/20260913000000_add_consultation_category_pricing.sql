-- ========================================================
-- Migration: Per-category consultation pricing + optional astrologer assignment
-- ========================================================
-- The storefront booking flow no longer lets the customer pick a specific
-- astrologer - an admin assigns one afterward, based on category and
-- availability. Price can no longer be read off a chosen astrologer's own
-- rate at booking time, since a category can span astrologers at different
-- price points (e.g. Love & Marriage has one at ₹999 and one at ₹499) - it's
-- set directly per category instead.

ALTER TABLE public.consultation_categories ADD COLUMN price NUMERIC(10,2);

-- Backfill from each category's current astrologers so existing categories
-- keep working immediately (the lowest price among that category's active
-- astrologers) - an admin can adjust any of these afterward from the
-- Consultation Categories screen.
UPDATE public.consultation_categories cc
SET price = sub.min_price
FROM (
  SELECT ac.category_id, MIN(a.price) AS min_price
  FROM public.astrologer_categories ac
  JOIN public.astrologers a ON a.id = ac.astrologer_id
  WHERE a.is_active = true AND a.price IS NOT NULL
  GROUP BY ac.category_id
) sub
WHERE cc.id = sub.category_id;

-- The astrologer is no longer known at booking time - an admin assigns (and
-- names) one afterward from the Consultations screen, so this can no longer
-- be required at insert time.
ALTER TABLE public.consultations ALTER COLUMN astrologer_name DROP NOT NULL;
