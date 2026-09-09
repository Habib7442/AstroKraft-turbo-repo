-- ========================================================
-- Migration: Make the purohit booking rate limit atomic
-- ========================================================
-- SECURITY FIX: the API route previously did a separate SELECT count(*)
-- followed by an INSERT, both as plain round-trips from Node. Two requests
-- for the same phone number arriving concurrently can both run their count
-- query and see count < RATE_LIMIT_MAX_PER_HOUR before either one's insert
-- commits — a classic check-then-act race (TOCTOU). Neither request is
-- wrong in isolation, so the rate limit is bypassed regardless of how
-- carefully the phone value is normalized on the way in.
--
-- Fix: move the count-check-insert into a single Postgres function and
-- serialize concurrent callers for the same phone with a transaction-scoped
-- advisory lock (pg_advisory_xact_lock) before counting. Every other
-- request for that phone blocks on the lock until the first one's
-- transaction commits (or rolls back), so the count it then sees always
-- includes anything already inserted by a request that got there first —
-- the race is closed at the database, not by reordering app code, since
-- app-level reordering can never make two independent HTTP requests
-- atomic with each other.
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
  p_attachment_url TEXT,
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
  -- hashtextextended(phone, 0) maps the phone to a stable bigint lock key.
  -- Transaction-scoped: acquired here, released automatically at this
  -- function's COMMIT/ROLLBACK, so no explicit unlock is needed and a
  -- crashed connection can never leak the lock.
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
    attachment_url, status
  ) VALUES (
    p_user_id, p_name, p_phone, p_location, p_ritual_type, p_preferred_date,
    p_preferred_time, p_language_preference, p_materials_option, p_message,
    p_attachment_url, 'new'
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

-- SECURITY INVOKER (the default — no SECURITY DEFINER here): the function
-- must run under RLS as whichever role calls it. The service-role client
-- used by the /api/purohit-bookings route already bypasses RLS entirely, so
-- this changes nothing for the real call path; but it also means the table
-- having no public INSERT policy continues to block anon/authenticated
-- callers from using this function to write rows, exactly as before this
-- migration.
