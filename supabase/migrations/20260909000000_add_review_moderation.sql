-- ========================================================
-- Migration: Review moderation + live product rating aggregate
-- ========================================================
-- The original schema only had SELECT/INSERT policies on `reviews` — no way
-- for an admin to ever approve/reject a submitted review. Also, products.rating
-- and products.review_count were never wired to the actual reviews table;
-- this trigger keeps them as a real, always-current aggregate of approved
-- reviews instead of a manually-set placeholder.

CREATE POLICY "Admins update reviews" ON public.reviews
  FOR UPDATE USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  affected_product_id UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  IF affected_product_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.products
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
      WHERE product_id = affected_product_id AND status = 'approved'
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM public.reviews
      WHERE product_id = affected_product_id AND status = 'approved'
    )
  WHERE id = affected_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Covers a brand new review landing as 'approved' directly, a pending review
-- being approved/rejected later, a rating edit on an already-approved review,
-- and a review being deleted outright.
CREATE TRIGGER reviews_refresh_product_rating
AFTER INSERT OR UPDATE OF status, rating OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();
