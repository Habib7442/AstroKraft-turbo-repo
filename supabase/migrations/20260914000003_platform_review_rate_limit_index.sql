-- ========================================================
-- Migration: Index the platform review rate-limit lookup
-- ========================================================
-- create_platform_review's count-check (see
-- 20260914000001_atomic_platform_review_rate_limit.sql) filters by
-- submitter_ip and created_at with no supporting index, so it degrades to a
-- full table scan as platform_reviews grows - including on submissions the
-- function ultimately rejects, since the scan runs before the limit check.
CREATE INDEX idx_platform_reviews_submitter_ip_created_at
  ON public.platform_reviews (submitter_ip, created_at DESC);

-- The original query used "submitter_ip IS NOT DISTINCT FROM p_submitter_ip"
-- to treat a null IP as its own bucket, but that form isn't sargable against
-- a plain btree index (Postgres can't push a NOT DISTINCT FROM comparison
-- into an index scan the way it can plain equality or IS NULL) - so the new
-- index above would still go unused for null IPs. Branching into equality
-- vs. IS NULL lets both cases hit the index.
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

  INSERT INTO public.platform_reviews (name, rating, comment, submitter_ip, status)
  VALUES (p_name, p_rating, p_comment, p_submitter_ip, 'pending')
  RETURNING * INTO v_review;

  RETURN v_review;
END;
$$;

-- SECURITY INVOKER means an anon caller invoking this function directly
-- still runs the advisory lock and count query as anon before RLS blocks
-- the INSERT - wasted work at best, a lock-contention lever at worst. Only
-- the service-role client in /api/platform-reviews is meant to call this.
REVOKE EXECUTE ON FUNCTION public.create_platform_review(
  TEXT, INTEGER, TEXT, TEXT, INTEGER, INTERVAL
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_platform_review(
  TEXT, INTEGER, TEXT, TEXT, INTEGER, INTERVAL
) TO service_role;
