-- ========================================================
-- Migration: Cap platform_reviews name/comment length at the database too
-- ========================================================
-- The Zod schema (platformReviewSchema) already caps name at 100 chars and
-- comment at 2000, but that's only enforced by whichever caller happens to
-- go through it - the same reasoning that already gave `rating` its own
-- CHECK constraint below (an anonymous, unauthenticated write path has no
-- signed-in caller to trust to always go through the app's own validation).
ALTER TABLE public.platform_reviews
  ADD CONSTRAINT platform_reviews_name_length CHECK (char_length(name) <= 100),
  ADD CONSTRAINT platform_reviews_comment_length CHECK (char_length(comment) <= 2000);
