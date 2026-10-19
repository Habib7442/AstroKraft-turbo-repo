-- ========================================================
-- Migration: VASTU by Biprangshu — Razorpay payment after Cal.com booking
-- ========================================================
-- Flow changed: Cal.com books a free slot, then the visitor is sent to
-- /pay/<leadId> to pay ₹1,900 via Razorpay. Payment state lives here:
--   unpaid  → order created, nothing attempted (or booking made, not yet paying)
--   pending → Razorpay order created, checkout opened
--   paid    → signature-verified by /api/razorpay/verify or the signed
--             /api/webhooks/razorpay (payment.captured / order.paid)
--   failed  → last attempt failed; the /pay page offers a retry
--   refunded → set by the team after a refund
-- paid_at / amount_paid (from the first migration) are filled alongside 'paid'.

ALTER TABLE public.vastu_leads
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_vastu_leads_payment_status ON public.vastu_leads(payment_status);
