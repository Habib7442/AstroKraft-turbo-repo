-- ========================================================
-- Migration: Backfill products.rating / review_count
-- ========================================================
-- CORRECTNESS FIX: the reviews_refresh_product_rating trigger (previous
-- migration) only recomputes a product's rating/review_count when a review
-- row is later inserted/updated/deleted — it never touched existing rows.
-- Any product that already had approved reviews before that migration ran
-- kept its old placeholder rating/review_count until someone happened to
-- edit or delete one of its reviews, so the product page's review_count
-- ("No reviews yet") could visibly disagree with the approved reviews
-- ProductReviews was actually rendering.
--
-- One-time backfill: recompute every product's rating/review_count from
-- its current approved reviews right now. Products with no approved
-- reviews are intentionally left untouched — they're not in the
-- aggregate's GROUP BY, so they keep whatever placeholder they already
-- had, which is correct since there's nothing to aggregate for them.
UPDATE public.products p
SET
  rating = COALESCE(agg.avg_rating, 0),
  review_count = COALESCE(agg.review_count, 0)
FROM (
  SELECT product_id,
         ROUND(AVG(rating)::numeric, 2) AS avg_rating,
         COUNT(*) AS review_count
  FROM public.reviews
  WHERE status = 'approved'
  GROUP BY product_id
) agg
WHERE p.id = agg.product_id;
