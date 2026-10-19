-- ========================================================
-- Migration: VASTU by Biprangshu — consultation leads & bookings
-- ========================================================
-- Landing page for Meta ads (apps/vastu). One row per prospect:
--   1. /api/leads inserts it when the intake form is submitted (status 'lead'),
--      with UTM / fbclid / Meta cookies for campaign attribution.
--   2. /api/webhooks/cal (signature-verified) updates the same row as Cal.com
--      reports the booking created / paid / rescheduled / cancelled, matched
--      by the leadId passed into the Cal.com embed as booking metadata.
--      A booking that arrives without a known leadId (e.g. someone opened the
--      Cal.com link directly) gets its own row, keyed by cal_booking_uid.
-- Both writers use the service-role client; there is no public insert or
-- update policy on this table, by design (same reasoning as purohit_bookings).

CREATE TABLE public.vastu_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Intake form
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_stage TEXT NOT NULL CHECK (business_stage IN ('existing', 'new', 'expansion')),
  problems TEXT[] NOT NULL DEFAULT '{}',
  floor_plan_available BOOLEAN NOT NULL DEFAULT false,

  -- Funnel state (driven by Cal.com webhooks)
  status TEXT NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead', 'booked', 'rescheduled', 'cancelled', 'completed', 'no_show')),
  -- Paid / unpaid is paid_at IS NOT NULL — kept separate from status so a
  -- rescheduled or completed booking still shows as paid.
  -- Team-managed follow-up (admin only)
  follow_up_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (follow_up_status IN ('pending', 'contacted', 'interested_premium', 'not_interested', 'converted')),
  premium_interest BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,

  -- Cal.com booking
  cal_booking_uid TEXT UNIQUE,
  cal_booking_id BIGINT,
  attendee_email TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  amount_paid NUMERIC(10, 2),
  paid_at TIMESTAMPTZ,
  last_cal_event TEXT,
  cal_payload JSONB,

  -- Attribution
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

CREATE INDEX idx_vastu_leads_status ON public.vastu_leads(status);
CREATE INDEX idx_vastu_leads_created_at ON public.vastu_leads(created_at);
CREATE INDEX idx_vastu_leads_whatsapp ON public.vastu_leads(whatsapp, created_at);
CREATE INDEX idx_vastu_leads_utm_campaign ON public.vastu_leads(utm_campaign);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vastu_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vastu_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read vastu leads" ON public.vastu_leads
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins update vastu leads" ON public.vastu_leads
  FOR UPDATE USING (public.is_admin());
