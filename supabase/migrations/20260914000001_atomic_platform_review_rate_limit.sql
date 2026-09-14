-- ========================================================
-- Migration: Rate-limit public platform review submissions
-- ========================================================
-- SECURITY FIX: the API route inserted directly via the service-role
-- client, which bypasses RLS entirely - there was no signed-in user to
-- gate the write, and the honeypot field only stops a bot naive enough to
-- fill every input. A caller that simply omits the honeypot field could
-- create unlimited pending rows: no database-capacity protection, and no
-- protection for the admin moderation queue itself (the thing actually
-- meant to keep spam off the public page still has to be waded through by
-- a human, one row at a time).
--
-- Same fix as create_purohit_booking (see
-- 20260909000002_atomic_purohit_booking_rate_limit.sql): move the
-- count-check-insert into a single Postgres function, serialized per
-- submitter IP with a transaction-scoped advisory lock so two concurrent
-- requests from the same IP can't both see count < limit before either
-- commits (TOCTOU). There's no phone/email collected here to key on, so
-- this rate-limits by IP address instead - not shown publicly, only used
-- for this check and left visible to admins for moderation context.
ALTER TABLE public.platform_reviews ADD COLUMN submitter_ip TEXT;

CREATE OR REPLACE FUNCTION public.create_platform_review(
  p_name TEXT,
  p_rating INTEGER,
  p_comment TEXT,
  p_submitter_ip TEXT,
  p_rate_limit_max INTEGER,
  p_rate_limit_window INTERVAL
)
RETURNS public.platform_reviews
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_review public.platform_reviews;
BEGIN
  -- Transaction-scoped: acquired here, released automatically at this
  -- function's COMMIT/ROLLBACK, so a crashed connection can never leak it.
  -- An unknown IP (p_submitter_ip null) still gets a stable lock key so
  -- concurrent no-IP callers serialize against each other too, rather than
  -- skipping the limit entirely.
  PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(p_submitter_ip, 'unknown'), 0));

  SELECT count(*) INTO v_count
  FROM public.platform_reviews
  WHERE submitter_ip IS NOT DISTINCT FROM p_submitter_ip
    AND created_at >= now() - p_rate_limit_window;

  IF v_count >= p_rate_limit_max THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.platform_reviews (name, rating, comment, submitter_ip, status)
  VALUES (p_name, p_rating, p_comment, p_submitter_ip, 'pending')
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;

-- SECURITY INVOKER (the default) - matches create_purohit_booking's own
-- reasoning: the service-role client used by /api/platform-reviews already
-- bypasses RLS, so this changes nothing for the real call path, but the
-- table having no public INSERT policy still blocks anon/authenticated
-- callers from using this function to write rows directly.
