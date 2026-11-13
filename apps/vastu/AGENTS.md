# apps/vastu — VASTU by Biprangshu landing page

Meta-ads landing pages for two 1:1 Vastu consultations sharing one booking flow:
`/` = Flat Vastu (₹999), `/business-vastu` = Business Vastu (₹1,999).
Separate brand (blue & white with gold CTAs) — does not use `@astrokraft/theme` or Clerk.

- Offers live in `lib/site.ts` (`OFFERS`). A lead's offer is derived from
  `business_category`: `Flat / Apartment` = flat, any business type = business
  (`offerForCategory`). create-order, mark-paid (`amount_paid`), the pay page and
  host emails all price from the stored lead, never from the client.
- Header/footer/sticky CTA: `components/site-chrome.tsx`; client testimonials:
  `lib/testimonials.ts`.
- `/vastu-masterclass` = ₹199 live group intro session (Astro Vastu Masterclass), AstroKraft-branded
  one-screen page with its own Razorpay checkout (`mc-*` tokens, Anton + Poppins); not part of the
  lead/Cal.com flow. Date/fee from `NEXT_PUBLIC_WORKSHOP_DATE` / `_FEE` (`lib/workshop.ts`); the
  intro reel is self-hosted in `public/workshop-reel.mp4` (+ `-poster.webp`). Name + WhatsApp → `POST /api/masterclass/create-order`
  (zod `masterclassRegistrationSchema`, amount = `NEXT_PUBLIC_WORKSHOP_FEE` server-side, row in
  `masterclass_registrations`, order notes `app=vastu-masterclass`) → checkout →
  `/api/masterclass/verify` → `/vastu-masterclass/thank-you?id=<registrationId>` (paid rows only:
  "Join the WhatsApp Group" → server-only `WHATSAPP_GROUP_INVITE_LINK`, where the Zoom link/date live;
  Purchase pixel `purchase_mc_<id>`). Both writers of 'paid' go through `lib/masterclass.ts`
  `markRegistrationPaid` (idempotent, emails the team); `/api/webhooks/razorpay` routes on `notes.app`.
  Migration `supabase/migrations/20261113000000_add_masterclass_registrations.sql`.
- Google Sheet (`lib/google-sheets.ts` → Apps Script web app `google-apps-script/masterclass-sheet.gs`,
  no Cloud project/service account): every paid row is appended to tab "Registrations" by
  `syncRegistrationToSheet` — claimed via `sheet_synced_at` (conditional UPDATE) so verify + webhook
  can't double-append, re-checked by Payment ID inside the script (under LockService), released on
  failure and retried by the next webhook delivery / thank-you page load. create-order appends to
  "Leads - Not Paid" (status Initiated, de-duped by phone, via `after()`); payment flips it to Paid.
  Env: `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET` (skipped when unset). Editing the script needs a
  new deployment version (Deploy → Manage deployments → Edit → New version) to go live.

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
- Admin app: `apps/admin` screen "1:1 Vastu Consultations" (`vastu-consultations.tsx`)
  reads `vastu_leads` (admin RLS); the Cal webhook stores the join link in `meeting_url`
  and `lib/push-admins.ts` pushes paid-booking alerts (data.type `vastu_consultation`).
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
