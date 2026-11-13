-- ========================================================
-- Migration: Astro Vastu Masterclass — recoverable Google Sheet sync claim
-- ========================================================
-- sheet_synced_at used to double as both the "claimed" and the "done" marker:
-- a worker set it BEFORE appending to the Sheet and cleared it on failure.
-- If the process died between those two steps (timeout, crash, redeploy) the
-- marker stayed set with no Sheet row, and every later retry skipped the row
-- for good.
--
-- Now the claim lives in its own column and expires: a worker claims a row by
-- setting sheet_sync_claimed_at (only if unclaimed or the claim is older than
-- the expiry window in lib/masterclass.ts), and sets sheet_synced_at only
-- AFTER the Sheet confirmed the append. A crashed worker's claim simply
-- expires and the next webhook delivery / thank-you page load retries; the
-- Apps Script's own Payment-ID check keeps that retry from duplicating a row.

ALTER TABLE public.masterclass_registrations
  ADD COLUMN IF NOT EXISTS sheet_sync_claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.masterclass_registrations.sheet_synced_at IS
  'Set only after the paid row was appended to the Google Sheet (completion marker).';
COMMENT ON COLUMN public.masterclass_registrations.sheet_sync_claimed_at IS
  'Short-lived claim taken before appending to the Google Sheet; expires so a crashed worker cannot block retries.';
