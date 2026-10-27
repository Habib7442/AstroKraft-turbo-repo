-- ========================================================
-- Migration: VASTU by Biprangshu — store the consultation join link
-- ========================================================
-- The Cal Video link was only inside cal_payload (videoCallData.url). The
-- admin app's "1:1 Consultations" screen shows a "Join call" button, so it
-- gets its own column, written by /api/webhooks/cal on every booking event
-- that carries it, and backfilled here for existing bookings.

ALTER TABLE public.vastu_leads ADD COLUMN IF NOT EXISTS meeting_url TEXT;

UPDATE public.vastu_leads
SET meeting_url = cal_payload -> 'videoCallData' ->> 'url'
WHERE meeting_url IS NULL
  AND cal_payload -> 'videoCallData' ->> 'url' LIKE 'https://%';

-- The admin list orders paid upcoming consultations by slot time.
CREATE INDEX IF NOT EXISTS idx_vastu_leads_scheduled_start ON public.vastu_leads(scheduled_start);
