-- ========================================================
-- Migration: Consultation payment tracking (Razorpay refs + status lifecycle)
-- ========================================================

ALTER TABLE public.consultations
  ADD COLUMN razorpay_order_id TEXT,
  ADD COLUMN razorpay_payment_id TEXT;

ALTER TABLE public.consultations ALTER COLUMN slot_timestamp SET DEFAULT now();

-- Widen the status machine to include the payment lifecycle, same pattern as orders.
ALTER TABLE public.consultations DROP CONSTRAINT consultations_status_check;
ALTER TABLE public.consultations ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('payment_pending', 'payment_failed', 'booked', 'completed', 'cancelled', 'no_show'));
