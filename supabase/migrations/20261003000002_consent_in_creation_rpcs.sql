-- ========================================================
-- Migration: write consent with the row, in one transaction
-- ========================================================
-- Consent was recorded by a separate UPDATE after the create RPC returned,
-- so a failed UPDATE left a booking/testimonial with no proof of consent
-- (DPDP s.6(10)). Both RPCs now take the notice version and stamp
-- consented_at in the same INSERT.
--
-- p_consent_notice_version defaults to NULL only so the currently deployed
-- code (which does not pass it yet) keeps working between applying this
-- migration and deploying the matching route change. The old signatures are
-- dropped so PostgREST never has two overloads to choose between.

DROP FUNCTION IF EXISTS public.create_platform_review(TEXT, INTEGER, TEXT, TEXT, INTEGER, INTERVAL);

CREATE FUNCTION public.create_platform_review(
  p_name TEXT,
  p_rating INTEGER,
  p_comment TEXT,
  p_submitter_ip TEXT,
  p_rate_limit_max INTEGER,
  p_rate_limit_window INTERVAL,
  p_consent_notice_version TEXT DEFAULT NULL
)
RETURNS public.platform_reviews
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_review public.platform_reviews;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(p_submitter_ip, 'unknown'), 0));

  IF p_submitter_ip IS NULL THEN
    SELECT count(*) INTO v_count
    FROM public.platform_reviews
    WHERE submitter_ip IS NULL
      AND created_at >= now() - p_rate_limit_window;
  ELSE
    SELECT count(*) INTO v_count
    FROM public.platform_reviews
    WHERE submitter_ip = p_submitter_ip
      AND created_at >= now() - p_rate_limit_window;
  END IF;

  IF v_count >= p_rate_limit_max THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.platform_reviews (
    name, rating, comment, submitter_ip, status, consent_notice_version, consented_at
  ) VALUES (
    p_name, p_rating, p_comment, p_submitter_ip, 'pending', p_consent_notice_version,
    CASE WHEN p_consent_notice_version IS NULL THEN NULL ELSE now() END
  )
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_platform_review(
  TEXT, INTEGER, TEXT, TEXT, INTEGER, INTERVAL, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_platform_review(
  TEXT, INTEGER, TEXT, TEXT, INTEGER, INTERVAL, TEXT
) TO service_role;

DROP FUNCTION IF EXISTS public.create_purohit_booking(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT, INTEGER, INTERVAL
);

CREATE FUNCTION public.create_purohit_booking(
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
  p_rate_limit_window INTERVAL,
  p_consent_notice_version TEXT DEFAULT NULL
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
    attachment_key, status, consent_notice_version, consented_at
  ) VALUES (
    p_user_id, p_name, p_phone, p_location, p_ritual_type, p_preferred_date,
    p_preferred_time, p_language_preference, p_materials_option, p_message,
    p_attachment_key, 'new', p_consent_notice_version,
    CASE WHEN p_consent_notice_version IS NULL THEN NULL ELSE now() END
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

-- Same lockdown as create_platform_review: only the service-role client in
-- /api/purohit-bookings should call this, never anon directly.
REVOKE EXECUTE ON FUNCTION public.create_purohit_booking(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT, INTEGER, INTERVAL, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_purohit_booking(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT, INTEGER, INTERVAL, TEXT
) TO service_role;
