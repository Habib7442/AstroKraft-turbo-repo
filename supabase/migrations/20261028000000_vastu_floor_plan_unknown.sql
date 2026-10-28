-- ========================================================
-- Migration: VASTU by Biprangshu — floor plan answer can be unknown
-- ========================================================
-- The short flat-Vastu booking form makes "Have a floor plan?" optional.
-- A skipped answer must not be stored as "No" (the post-payment screen would
-- then ask for photos from someone who has a plan), so NULL now means
-- "not answered". /api/leads omits the column when the question is skipped,
-- so without a default it lands as NULL. Existing rows keep their true/false.

ALTER TABLE public.vastu_leads ALTER COLUMN floor_plan_available DROP NOT NULL;
ALTER TABLE public.vastu_leads ALTER COLUMN floor_plan_available DROP DEFAULT;
