-- ========================================================
-- Migration: Purohit booking attachments are private, not public URLs
-- ========================================================
-- SECURITY FIX: attachment_url stored a permanent, publicly-reachable URL
-- (media.astrokraft.online is a public custom domain bound to the whole
-- astrokraft-media bucket, used for product images and banners) for
-- customer-submitted documents that can contain wedding invitations,
-- horoscope/muhurat details, home addresses, and phone numbers. That URL
-- was also emailed unencrypted to the internal team inbox and rendered as a
-- clickable link in the admin app with no authorization check — anyone who
-- ever saw the URL (a compromised/forwarded inbox, browser history, a log
-- line) could read the document forever, with no way to revoke access.
--
-- Fix: store the bare R2 object key instead of a URL. The key alone is
-- meaningless without R2 credentials — admins now get a short-lived (5
-- minute) signed download URL from the new r2-presign-download edge
-- function, minted on demand and gated on a valid Clerk admin JWT, the same
-- pattern r2-presign already uses for uploads. See apps/admin's
-- purohit-bookings screen and supabase/functions/r2-presign-download.
ALTER TABLE public.purohit_bookings RENAME COLUMN attachment_url TO attachment_key;

COMMENT ON COLUMN public.purohit_bookings.attachment_key IS
  'R2 object key under purohit-uploads/, not a URL. The object is private — fetch a short-lived signed download URL via the r2-presign-download edge function rather than reading this column as a link.';

-- Recreated with the renamed parameter/column and the same advisory-lock
-- rate limiting from the previous migration (unchanged otherwise).
CREATE OR REPLACE FUNCTION public.create_purohit_booking(
  p_user_id TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_location TEXT,
  p_ritual_type TEXT,
  p_preferred_date DATE,
  p_preferred_time TIME,
  p_language_preference TEXT,
  p_materials_option TEXT,
  p_message TEXT,
  p_attachment_key TEXT,
  p_rate_limit_max INTEGER,
  p_rate_limit_window INTERVAL
)
RETURNS public.purohit_bookings
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_booking public.purohit_bookings;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_phone, 0));

  SELECT count(*) INTO v_count
  FROM public.purohit_bookings
  WHERE phone = p_phone
    AND created_at >= now() - p_rate_limit_window;

  IF v_count >= p_rate_limit_max THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.purohit_bookings (
    user_id, name, phone, location, ritual_type, preferred_date,
    preferred_time, language_preference, materials_option, message,
    attachment_key, status
  ) VALUES (
    p_user_id, p_name, p_phone, p_location, p_ritual_type, p_preferred_date,
    p_preferred_time, p_language_preference, p_materials_option, p_message,
    p_attachment_key, 'new'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;
