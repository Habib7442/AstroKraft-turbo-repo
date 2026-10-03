-- ========================================================
-- Migration: record proof of notice + consent (DPDP Act 2023, s.6(10))
-- ========================================================
-- The Data Fiduciary must be able to prove that notice was given and consent
-- obtained. Each row now stores which privacy-notice version the person
-- accepted and when. Nullable on purpose: rows created before this migration
-- never captured consent, and backfilling a timestamp would fabricate it.

ALTER TABLE public.orders
  ADD COLUMN consent_notice_version TEXT,
  ADD COLUMN consented_at TIMESTAMPTZ;

ALTER TABLE public.consultations
  ADD COLUMN consent_notice_version TEXT,
  ADD COLUMN consented_at TIMESTAMPTZ;

ALTER TABLE public.purohit_bookings
  ADD COLUMN consent_notice_version TEXT,
  ADD COLUMN consented_at TIMESTAMPTZ;

ALTER TABLE public.platform_reviews
  ADD COLUMN consent_notice_version TEXT,
  ADD COLUMN consented_at TIMESTAMPTZ;
