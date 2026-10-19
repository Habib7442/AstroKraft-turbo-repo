# apps/vastu — VASTU by Biprangshu landing page

Single-page Meta-ads landing page for the ₹1,900 1:1 Business Vastu Consultation.
Separate brand (black & gold) — does not use `@astrokraft/theme` or Clerk.

Flow: Book Now → intake form (`components/booking.tsx`) → `POST /api/leads` inserts a
`vastu_leads` row (with UTM/fbclid/_fbp/_fbc) → Cal.com inline embed prefilled with
name, phone and `metadata[leadId]` → Cal.com books a FREE slot and sends SMS (Workflows) → on `bookingSuccessful` the
browser goes to `/pay/<leadId>` → Razorpay checkout (`/api/razorpay/create-order`,
amount fixed server-side) → `/api/razorpay/verify` (signature) sets `payment_status='paid'`.
`/api/webhooks/razorpay` (HMAC `X-Razorpay-Signature`, only orders with notes.app=vastu)
is the backup if the tab closes. `/api/webhooks/cal` (HMAC `X-Cal-Signature-256`)
keeps booking status / slot times on the same row.

- Cal.com event has "Requires confirmation" ON: a booking arrives as `BOOKING_REQUESTED`
  (unconfirmed, no Cal.com SMS yet); after payment `lib/cal-api.ts` confirms it via the
  Cal.com v2 API (`CAL_API_KEY`), which triggers Cal.com's confirmation SMS/email.
  Whichever arrives second (payment or the Cal webhook) does the confirm.
- Booking state = `status`; payment state = `payment_status` (+ `paid_at`, `razorpay_*`).
  Both writers of 'paid' go through `lib/mark-paid.ts` (idempotent).
- Meta: browser pixel (`components/meta-pixel.tsx`) + CAPI (`lib/meta-capi.ts`) with
  shared event ids (`lead_<id>`, `purchase_<id>`) for dedupe. Both no-op without env.
- Env: see `.env.example`. Migration: `supabase/migrations/20261019000000_add_vastu_leads.sql`.
- Dev: `npm run dev --workspace=@astrokraft/vastu` (port 3002).
