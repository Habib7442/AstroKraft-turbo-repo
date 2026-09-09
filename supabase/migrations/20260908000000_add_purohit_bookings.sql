-- ========================================================
-- Migration: Purohit Booking (puja lead capture)
-- ========================================================
-- Pure lead capture, no payment: a visitor describes the puja they need and
-- leaves contact details, the team follows up to quote a price and confirm
-- the priest. Written only by the /api/purohit-bookings service-role route
-- (spec docs/specs/web/0001-purohit-booking.md) — there is no public insert
-- or update RLS policy on this table, ever.

CREATE TABLE public.purohit_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  ritual_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  language_preference TEXT NOT NULL,
  materials_option TEXT NOT NULL CHECK (materials_option IN ('purohit_only', 'purohit_and_samagri')),
  message TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purohit_bookings_status ON public.purohit_bookings(status);
CREATE INDEX idx_purohit_bookings_created_at ON public.purohit_bookings(created_at);

ALTER TABLE public.purohit_bookings ENABLE ROW LEVEL SECURITY;

-- Admin only: every insert goes through the service-role client in the
-- create route, which bypasses RLS entirely, so no INSERT policy is needed
-- (or wanted — a public insert policy is the exact spam surface this design
-- avoids, see the spec's "Options considered").
CREATE POLICY "Admins read purohit bookings" ON public.purohit_bookings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins update purohit bookings" ON public.purohit_bookings
  FOR UPDATE USING (public.is_admin());
