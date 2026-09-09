-- ========================================================
-- Migration: Enforce one review per user per product
-- ========================================================
-- SECURITY/CORRECTNESS FIX: /api/reviews checked for an existing review
-- (SELECT ... WHERE user_id = ? AND product_id = ?) before inserting, as two
-- separate round-trips with nothing in between to stop another request for
-- the same (user_id, product_id) from also passing that check before either
-- insert commits — a TOCTOU race. Two concurrent submissions (e.g. a
-- double-tap, or a retried request after a slow/dropped response) could
-- both read "no existing review" and both insert, leaving a product with
-- two reviews from the same user despite the route's own stated rule.
--
-- Fix: back the rule with an actual constraint. The route's SELECT-then-
-- INSERT still runs first (a fast, friendly error for the common case), but
-- the constraint is what actually prevents duplicates under concurrency —
-- a losing concurrent insert now fails with 23505 (unique_violation), which
-- the route maps to the same "already reviewed" 400 response.
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_product_id_key UNIQUE (user_id, product_id);
