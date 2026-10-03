# DPDP Act 2023 — Operations Runbook

AstroKraft is a Data Fiduciary under the Digital Personal Data Protection Act, 2023. This file holds what the code cannot do by itself: the breach procedure, one-time setup, and recurring duties. Grievance contact: **vastubipra@gmail.com**.

Timelines marked *(Rules)* come from the DPDP Rules, 2025. Confirm them against the notified Rules before relying on them.

## 1. Personal data breach (s.8(6), penalty up to ₹200 crore)

A breach is any unauthorised processing, disclosure, alteration, loss of access or destruction of personal data. Examples: a leaked service-role key, an exposed R2 object, a compromised admin phone, a Supabase misconfiguration.

1. **Contain (hour 0):** rotate the affected keys: Supabase service role, Clerk secret, R2 keys, Razorpay, Resend, Telegram bot. Revoke admin sessions in Clerk. Disable the leaking route or policy.
2. **Record:** what data, whose, how many people, when it started, when it was found, how. Keep logs and screenshots.
3. **Notify the Data Protection Board** without delay with an initial intimation, then a detailed report within **72 hours** of becoming aware *(Rules)*. The report covers facts, cause, likely impact, remedial steps, and the people informed.
4. **Notify each affected person** without delay, by email or phone. Say what happened, which of their data was affected, the likely consequences, what we have done, what they can do (e.g. watch for fraud calls), and the contact email.
5. **Follow up:** fix the root cause, then update this runbook.

The Board can penalise a missed notification separately from the breach itself.

## 2. One-time setup (do before go-live)

- [ ] Apply migrations `20261003000000` to `20261003000003` (consent columns, retention job, consent inside the creation functions, keeping paid consultations) **before** deploying the matching code. Checkout and bookings fail if the code ships first.
- [ ] Confirm the cron job exists: `select * from cron.job where jobname = 'purge-expired-personal-data';`
- [ ] **Cloudflare R2:** add a lifecycle rule on bucket `astrokraft-media`, prefix `purohit-uploads/`, deleting objects after **180 days**. The privacy policy promises this, and the database purge cannot delete R2 files.
- [ ] **PostHog:** Project settings → enable "Discard client IP data".
- [ ] **Clerk:** make sure the production webhook subscribes to `user.deleted`, so deletions from the Clerk dashboard also erase data.
- [ ] **Processor contracts (s.8(2)):** accept or download the DPA for each service, and keep copies here: Clerk, Supabase, Cloudflare, Vercel, Razorpay, Resend, PostHog, Expo. Telegram has no DPA, so alerts there carry only first names and IDs. Keep it that way.
- [ ] **Existing customers (s.5(2)):** email everyone who signed up before 3 October 2026 with a short notice. Say what data we hold and why, link the Privacy Policy and the Your Data & Privacy page, and give the grievance email.

## 3. Ongoing duties

- **Grievances (s.13):** acknowledge within 48 hours and resolve within 30 days, as the privacy policy promises. Keep a simple log (date, request, action, date closed).
- **Erasure, correction and nomination requests by email:** verify the person (e.g. by replying from the email on the account, or the booking phone number), act, and log it. For bookings without an account, delete the `purohit_bookings` row in the Supabase dashboard, and its file (the row's `attachment_key`) in the Cloudflare R2 dashboard. The admin app has no delete action for bookings or reviews yet.
- **Withdrawn testimonial or review:** delete the row (`platform_reviews` / `reviews`) in the Supabase dashboard the same day.
- **Policy changes:** update the privacy policy page and bump `PRIVACY_NOTICE_VERSION` in `packages/validators` to the same date. Every new order or booking stores that version as proof of notice and consent (s.6(10)).
- **New third-party service:** add it to `apps/web/src/lib/data-processors.ts`, which feeds both the policy and the data export, and sign its DPA.
- **Never** put phone numbers, addresses or birth details into Telegram, push notifications, analytics events or logs.

## 4. Retention periods (enforced by `purge_expired_personal_data()`)

| Data | Kept for |
|---|---|
| Unpaid or abandoned orders and consultations | 30 days |
| Rejected reviews and testimonials | 30 days |
| Testimonial submitter IP | 30 days (then nulled) |
| Purohit booking requests | 90 days after preferred date |
| Purohit attachments (R2 lifecycle) | 180 days after upload |
| Paid orders and consultations | 8 years (tax and company law). On account deletion, paid consultations keep only invoice fields: birth details, phone and meeting link are wiped at once |
| Account, approved reviews | Until deleted by the user |
