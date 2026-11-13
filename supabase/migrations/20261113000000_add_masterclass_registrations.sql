-- ========================================================
-- Migration: Astro Vastu Masterclass — paid ₹199 intro-session signups
-- ========================================================
-- Landing page apps/vastu /vastu-masterclass. One row per checkout attempt:
--   1. /api/masterclass/create-order inserts it (payment_status 'pending') with
--      name + WhatsApp + attribution, then stores the Razorpay order id.
--   2. /api/masterclass/verify (checkout signature) or the signed
--      /api/webhooks/razorpay (notes.app = 'vastu-masterclass') flips it to
--      'paid' through lib/masterclass.ts markRegistrationPaid (idempotent).
-- Kept separate from vastu_leads on purpose: that table's payment flow is tied
-- to Cal.com bookings and the flat/business consultation fees.
-- Both writers use the service-role client; there is no public insert or
-- update policy, by design (same reasoning as purohit_bookings / vastu_leads).

CREATE TABLE public.masterclass_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  -- E.164, +91 followed by 10 digits (normalizeIndianMobile).
  whatsapp TEXT NOT NULL CHECK (whatsapp ~ '^\+91[6-9][0-9]{9}$'),

  -- Fee charged, in paise — fixed server-side, never taken from the client.
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 100),
  -- Which session the person paid for (the date label shown at checkout), so
  -- a later change of NEXT_PUBLIC_WORKSHOP_DATE doesn't rewrite history.
  session_label TEXT,

  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  -- Set when the paid row has been appended to the Google Sheet "Registrations"
  -- tab. Claimed with a conditional UPDATE (… WHERE sheet_synced_at IS NULL) so
  -- the verify call and the webhook can't both append; reset to NULL if the
  -- Sheets API fails, so a later call (webhook retry, thank-you page) retries.
  sheet_synced_at TIMESTAMPTZ,

  -- Attribution (Meta ads)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  fbp TEXT,
  fbc TEXT,
  user_agent TEXT,
  ip_address TEXT,

  consent_notice_version TEXT,
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- create-order reuses a recent unpaid attempt for the same number.
CREATE INDEX idx_masterclass_registrations_whatsapp ON public.masterclass_registrations (whatsapp, created_at DESC);
-- Admin lists paid sign-ups, newest first.
CREATE INDEX idx_masterclass_registrations_paid ON public.masterclass_registrations (paid_at DESC) WHERE payment_status = 'paid';

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.masterclass_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.masterclass_registrations ENABLE ROW LEVEL SECURITY;

-- (SELECT public.is_admin()) is evaluated once per statement, not per row.
CREATE POLICY "Admins read masterclass registrations" ON public.masterclass_registrations
  FOR SELECT USING ((SELECT public.is_admin()));

CREATE POLICY "Admins update masterclass registrations" ON public.masterclass_registrations
  FOR UPDATE USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
