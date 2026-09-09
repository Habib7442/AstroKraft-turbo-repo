-- ========================================================
-- Migration: Actually maintain updated_at on every table that has one
-- ========================================================
-- CORRECTNESS FIX: every updated_at column in the schema is
-- `DEFAULT now()` — set once, on INSERT, and never touched again. None of
-- the UPDATE statements across the app (admin status transitions on
-- purohit_bookings/orders, product/promo_banner/astrologer edits, the
-- Clerk webhook's profile sync) set updated_at themselves, so the column
-- silently freezes at each row's insert time forever. Reported against
-- purohit_bookings (apps/admin's status-transition UPDATE only writes
-- `status`), but the same gap exists on every other table below.
--
-- Fix: a BEFORE UPDATE trigger that forces NEW.updated_at = now() on every
-- row update, regardless of what the UPDATE statement itself set (or
-- didn't). Applied to every table that has an updated_at column.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.promo_banners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.astrologers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.purohit_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
