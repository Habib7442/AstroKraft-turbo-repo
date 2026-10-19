# apps/vastu — VASTU by Biprangshu landing page

Single-page Meta-ads landing page for the ₹1,900 1:1 Business Vastu Consultation.
Separate brand (black & gold) — does not use `@astrokraft/theme` or Clerk.

Flow: Book Now → intake form (`components/booking.tsx`) → `POST /api/leads` inserts a
`vastu_leads` row (with UTM/fbclid/_fbp/_fbc) → Cal.com inline embed prefilled with
name, phone and `metadata[leadId]` → Cal.com books a FREE slot as UNCONFIRMED
(`BOOKING_REQUESTED`, no SMS yet; the slot stays blocked) → on `bookingSuccessful` the
browser goes to `/pay/<leadId>` → Razorpay checkout (`/api/razorpay/create-order`,
amount fixed server-side, reuses the lead's still-payable order) → `/api/razorpay/verify`
(signature) sets `payment_status='paid'` → the booking is confirmed via the Cal.com API,
and only then does Cal.com send its confirmation SMS (Workflows) / email.
`/api/webhooks/razorpay` (HMAC `X-Razorpay-Signature`, only orders with notes.app=vastu)
is the backup if the tab closes. `/api/webhooks/cal` (HMAC `X-Cal-Signature-256`)
keeps booking status / slot times on the same row.

- Cal.com event has "Requires confirmation" ON: a booking arrives as `BOOKING_REQUESTED`
  (unconfirmed, no Cal.com SMS yet); after payment `lib/cal-api.ts` confirms it via the
  Cal.com v2 API (`CAL_API_KEY`), which triggers Cal.com's confirmation SMS/email.
  Whichever arrives second (payment or the Cal webhook) does the confirm.
- Biprangshu does not use Cal.com: `lib/notify-host.ts` emails him (cc the team) via
  Resend for PAID bookings only — confirmed (on `BOOKING_CREATED`, with the Cal Video
  link from `videoCallData.url`), rescheduled, cancelled. The Cal.com account email is
  the team's, so unpaid "booking requested" mails go to the team, never to him.
- Booking state = `status`; payment state = `payment_status` (+ `paid_at`, `razorpay_*`).
  Both writers of 'paid' go through `lib/mark-paid.ts` (idempotent). If a paid order id
  isn't the lead's stored one (an older order completed late), it falls back to the
  order's `notes.leadId` from Razorpay; a second payment for a paid lead is logged
  as `DUPLICATE vastu payment — refund needed`.
- Meta: browser pixel (`components/meta-pixel.tsx`) + CAPI (`lib/meta-capi.ts`) with
  shared event ids (`lead_<id>`, `purchase_<id>`) for dedupe. Both no-op without env.
- Env: see `.env.example`. Migrations: `supabase/migrations/20261019000000_add_vastu_leads.sql`,
  `20261019000001_vastu_razorpay_payment.sql`.
- Dev: `npm run dev --workspace=@astrokraft/vastu` (port 3002).
