-- ========================================================
-- Migration: automatic erasure of expired personal data (DPDP Act s.8(7))
-- ========================================================
-- Personal data must be erased once its purpose is served, unless a law
-- requires keeping it. Periods (mirrored in the privacy policy):
--   unpaid / abandoned orders & consultations   30 days
--   rejected product reviews & testimonials     30 days
--   testimonial submitter IP (rate limiting)    30 days, then nulled
--   Purohit booking leads                       90 days after the preferred date
--   paid orders & consultations                 8 years (Companies Act s.128 /
--                                               CGST Act s.36 accounting records)
-- Purohit attachments in R2 are expired separately by an R2 lifecycle rule
-- on the purohit-uploads/ prefix - the database cannot delete R2 objects.

CREATE OR REPLACE FUNCTION public.purge_expired_personal_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.orders
  WHERE status IN ('created', 'payment_pending', 'payment_failed')
    AND created_at < now() - interval '30 days';

  DELETE FROM public.consultations
  WHERE status IN ('payment_pending', 'payment_failed')
    AND created_at < now() - interval '30 days';

  DELETE FROM public.reviews
  WHERE status = 'rejected' AND created_at < now() - interval '30 days';

  DELETE FROM public.platform_reviews
  WHERE status = 'rejected' AND created_at < now() - interval '30 days';

  UPDATE public.platform_reviews
  SET submitter_ip = NULL
  WHERE submitter_ip IS NOT NULL AND created_at < now() - interval '30 days';

  DELETE FROM public.purohit_bookings
  WHERE preferred_date < current_date - 90;

  DELETE FROM public.orders
  WHERE created_at < now() - interval '8 years';

  DELETE FROM public.consultations
  WHERE created_at < now() - interval '8 years';
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_personal_data() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Daily at 02:00 IST (20:30 UTC). cron.schedule upserts by job name, so
-- re-running this migration does not create a duplicate job.
SELECT cron.schedule(
  'purge-expired-personal-data',
  '30 20 * * *',
  'SELECT public.purge_expired_personal_data()'
);
