# 0001. Purohit Booking Lead Capture Form

**Date**: 2026-09-08
**Status**: In Progress

## Summary

This adds a Purohit Booking form to the storefront so a visitor can describe the puja (ritual) they need and leave their contact details, without paying anything up front. The AstroKraft team reviews each request and follows up directly to arrange the priest, materials, and price. A new database table stores the requests, a team email fires on each new submission, and a new screen in the admin app lets the team track and update each request's status.

See [rationale.md](./rationale.md) for the context and the options considered. See [verify.md](./verify.md) for the verification checklist.

## Requirements

**User stories**:
- As a visitor, I want to submit my puja details and contact information without creating an account, so that I can request a booking with minimal friction.
- As the AstroKraft team, I want an email the moment a new request comes in, so that I do not have to keep checking a dashboard.
- As an admin using the mobile app, I want to see every Purohit booking request and update its status, so that I can track which leads have been contacted, confirmed, or completed.

**Acceptance criteria**:
- **AC-1**: The form can be submitted with name, mobile/WhatsApp number, location, ritual type, preferred date, language preference, and materials option filled in (all required); preferred time, message, and attachment may be left empty.
- **AC-2**: A preferred date before today is rejected, both by the date picker and by the server, regardless of what the client sends.
- **AC-3**: A successful submission creates a row in `purohit_bookings` with status `new`, and the visitor sees an on page confirmation (no confirmation email is sent to them).
- **AC-4**: A successful submission sends a Resend email to the team's inbox with the booking details; if that email fails to send, the booking submission still succeeds.
- **AC-5**: The visitor may attach one file before submitting (puja list, invitation, horoscope, or muhurat details); if the upload fails, the booking still submits successfully without the attachment.
- **AC-6**: A submission with the hidden honeypot field filled in is silently accepted (the caller sees a normal success response) but no row is written, so a bot cannot tell it was rejected.
- **AC-7**: A fourth submission from the same phone number within one hour is rejected with a clear, human readable message asking the visitor to wait for the team's callback instead.
- **AC-8**: If the visitor is signed in with Clerk when they submit, their profile is linked to the booking (`user_id` set); an anonymous visitor's booking is saved with `user_id` left empty, and this is never required.
- **AC-9**: Only an admin (`role: admin` in the Clerk session, enforced through the existing `is_admin()` Postgres function) can read or update rows in `purohit_bookings`; every other caller, signed in or not, gets zero rows back and cannot write.

## Decision

**Chosen option**: Option 1: Server side API route with a service role write

Two API routes handle the customer facing side (create a booking, get a presigned upload URL for the optional attachment), the admin app reads and updates `purohit_bookings` directly through Supabase with the existing `is_admin()` row level security policy, exactly like it already does for `orders` and `consultations`.

**Implementation skills**: `supabase` (`supabase/supabase`, `.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`supabase/supabase`, `.agents/skills/supabase-postgres-best-practices/`) · `clerk-nextjs-patterns` (`clerk/javascript`, `.agents/skills/clerk-nextjs-patterns/`)

## Feature design

**Data model sketch**:

New table `purohit_bookings`:

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID, PK | no | `gen_random_uuid()` |
| user_id | TEXT | yes | FK → `profiles(id)` ON DELETE SET NULL, opportunistic link when signed in |
| name | TEXT | no | |
| phone | TEXT | no | |
| location | TEXT | no | puja address |
| ritual_type | TEXT | no | one of the dropdown values, or free text when "Other" |
| preferred_date | DATE | no | must be ≥ today at submission time |
| preferred_time | TIME | yes | |
| language_preference | TEXT | no | one of the dropdown values, or free text when "Other" |
| materials_option | TEXT | no | CHECK IN (`purohit_only`, `purohit_and_samagri`) |
| message | TEXT | yes | |
| attachment_url | TEXT | yes | R2 URL under the `purohit-uploads/` prefix |
| status | TEXT | no | CHECK IN (`new`, `contacted`, `confirmed`, `completed`, `cancelled`), default `new` |
| created_at | TIMESTAMPTZ | no | default `now()` |
| updated_at | TIMESTAMPTZ | no | default `now()` |

No new relationships beyond the existing `profiles` table; no unique constraints (a person may submit more than one booking over time, only the short term rate limit above governs how often).

**State transitions**:

`new` → `contacted` → `confirmed` → `completed`; `cancelled` is reachable from `new`, `contacted`, or `confirmed`. The admin app is the only thing that moves a booking between states.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/purohit-bookings` | POST | name, phone, location, ritualType, preferredDate, preferredTime? (opt), languagePreference, materialsOption, message? (opt), attachmentUrl? (opt), a hidden honeypot field | bookingId, status | public, no auth | 400 validation failure, 429 rate limited |
| `/api/purohit-bookings/upload-url` | POST | fileName, contentType | uploadUrl (presigned PUT), publicUrl, key | public, no auth | 400 disallowed file type or missing fields |
| Admin list & status update | direct Supabase client (SELECT / UPDATE on `purohit_bookings`) | status filter (read); `status` (write) | rows / updated row | admin only (`is_admin()` RLS) | RLS denies silently (empty result / 0 rows affected) |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| POST `/api/purohit-bookings` | `id` | generated by the database (`gen_random_uuid()`) |
| POST `/api/purohit-bookings` | `status` on creation | column default (`'new'`) |
| POST `/api/purohit-bookings` | `user_id` | Clerk `auth()` on the server if the visitor is signed in, otherwise left null; never taken from the request body |
| POST `/api/purohit-bookings` | rate limit decision (AC-7) | a count query against `purohit_bookings` for rows with the same `phone` and `created_at` within the last hour |
| POST `/api/purohit-bookings` | honeypot decision (AC-6) | a hidden form field in the request body that a real visitor never fills |
| POST `/api/purohit-bookings` | "preferred date is not in the past" (AC-2) | server's own clock (`new Date()`), compared against the submitted `preferredDate`; the client also disables past dates in the picker |
| POST `/api/purohit-bookings/upload-url` | `key` | derived on the server: `purohit-uploads/${Date.now()}-${sanitized fileName}` |
| POST `/api/purohit-bookings/upload-url` | `publicUrl` | `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` env var (already `https://media.astrokraft.online`) plus `key` |
| Team notification email (AC-4) | recipient address | a constant in the new email helper, the same `astrokraftwebsitemanagement@gmail.com` address already used in `send-invoice-email.ts` |
| Team notification email (AC-4) | sender address | `RESEND_FROM_EMAIL` env var (already set) |

**Key invariants**:
- `preferred_date` is never stored in the past relative to the moment of submission.
- `materials_option` is always one of `purohit_only` or `purohit_and_samagri`.
- `status` is always one of `new`, `contacted`, `confirmed`, `completed`, `cancelled`.
- `attachment_url`, when present, always points under the `purohit-uploads/` R2 key prefix.
- The only way a row is ever inserted is through the `/api/purohit-bookings` route's service role client; the only way a row is ever updated is through an authenticated admin request. There is no public insert or update RLS policy on this table, ever.

**Security model**:
- Create: public, no Clerk session required. The API route itself (Zod validation, honeypot check, rate limit) is the only enforcement point, since row level security grants no public insert.
- Upload URL: public, no Clerk session required. The route restricts the content type and file size it will presign for, and confines every key to the `purohit-uploads/` prefix.
- Read and status update: admin only, enforced by a row level security policy using the existing `is_admin()` function (reads `role` from the Clerk JWT), exactly like the existing `orders` and `consultations` policies.
- No customer facing read exists for this table (a signed in visitor cannot see their own past requests through this feature); this is an explicit, intentional scope cut, not an oversight.
- No payment or card data is involved, so there is no PCI scope. The PII collected (name, phone, address) is treated the same as the PII already stored in `orders` and `consultations`, no new compliance obligation.

**Configuration required**:

No new environment variables or credentials. This feature reuses, unchanged: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_DOMAIN`, `SUPABASE_SERVICE_ROLE_KEY`, all already present in `apps/web/.env.local`.

**Critical test scenarios**:
- Happy path: an anonymous visitor fills every required field, attaches a file that uploads successfully, and submits; a row is created with status `new`, the page shows the confirmation state, and the team receives the notification email. Verifies **AC-1**, **AC-3**, **AC-4**, **AC-5**.
- Failure case: the attachment upload fails partway through; the booking still submits successfully with `attachment_url` left empty. Verifies **AC-5**.
- Failure case: the same phone number submits a fourth time inside one hour; the request is rejected with a clear message instead of creating a row. Verifies **AC-7**.
- Auth/permission: a signed in customer (not an admin) queries `purohit_bookings` directly through the Supabase client; row level security returns zero rows, and an attempted status update affects zero rows. Verifies **AC-9**.
- Edge case: a bot fills the hidden honeypot field and submits; the response looks like a normal success, but no row is written. Verifies **AC-6**.

## Build plan

Note: no build approach is recorded yet in `AGENTS.md` or a scope header, so this plan defaults to an end to end (tracer bullet) ordering: get one thin path working through every layer first, then thicken it.

1. [x] Write the migration for `purohit_bookings` (table, check constraints, indexes on `status` and `created_at`) plus its row level security policies (admin only select/update, no public policies), following the exact pattern already used for `orders` and `consultations`. Satisfies **AC-3**, **AC-8**, **AC-9**.
2. [x] Build `POST /api/purohit-bookings`: Zod validation for every field, the honeypot check, the phone based rate limit, the optional `user_id` link via Clerk `auth()`, and the insert through the Supabase service role client. Satisfies **AC-1**, **AC-2**, **AC-6**, **AC-7**, **AC-8**.
3. [x] Build `POST /api/purohit-bookings/upload-url`, using the existing `@astrokraft/storage` helpers (`createR2Client`, `generatePresignedUploadUrl`) with `apps/web`'s own R2 credentials, restricted to the `purohit-uploads/` prefix and an allow list of file types and a size limit. Satisfies **AC-5**.
4. [x] Add `send-purohit-booking-email.ts`, mirroring the existing `send-invoice-email.ts` conventions (Resend, best effort, wrapped so a failure never fails the caller), and call it from the create route right after a successful insert. Satisfies **AC-4**.
5. [x] Build the storefront Purohit Booking page (`/en/purohit-booking`, matching the singular `consultation` naming already used for that route folder): the form itself, the date picker with a minimum of today, the optional file picker that calls the upload URL route before final submit, the hidden honeypot input, and the on page confirmation state. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**.
6. [x] Build the admin app screen: a list of bookings queried directly against Supabase (admin RLS), a status filter, a detail view showing every field plus the attachment link, and a control to change status. Satisfies **AC-8**, **AC-9**.
7. [ ] Manually verify end to end on the real site: submit one real test booking, confirm the team email arrives, confirm the admin app shows it and can change its status, then delete the test row. Confirms every AC above.

## Consequences

**Positive**:
- The team gets one structured place to see every puja request instead of piecing details together from calls or WhatsApp messages.
- No new paid service or infrastructure is introduced; this reuses Resend, Cloudflare R2, and Supabase, all of which the project already runs and pays for.
- Keeping the form open to anonymous visitors keeps the funnel as frictionless as the stakeholder wants for a top of funnel inquiry form.

**Negative / tradeoffs**:
- The phone number based rate limit is a lightweight deterrent, not a robust anti abuse system; someone determined enough to rotate phone numbers can still spam the form. Acceptable for a low traffic, low value target endpoint, but worth revisiting if real spam shows up.
- With no confirmation email to the customer, their only record of what they submitted is the on page confirmation; if they navigate away without reading it, they have nothing until the team calls them.
- The upload URL endpoint accepts unauthenticated uploads (limited only by content type, size, and the `purohit-uploads/` prefix); in principle it could be used as small scale free file hosting by an attacker, though the practical incentive to do so is low.

**Neutral**:
- `purohit_bookings` becomes a fourth entity in the admin app, alongside orders, consultations, and reviews, following the same list plus status update pattern as the others.
- This is the first migration added since `20260902000001_link_consultations_to_astrologers.sql`; naming and RLS conventions carry forward unchanged.

## Follow-up

- [x] This repository has no `docs/scope/` entries yet; enroll a scope feature for Purohit Booking so this spec has a feature row to link to, and so future `/architect` or `/develop` passes can track its lifecycle status. (Done — see `docs/scope/web/scope.md`.)
- [ ] If spam through the public endpoints becomes a real problem, replace the phone based database rate limit with something sturdier (for example Upstash Redis, or Vercel's built in edge rate limiting), rather than tightening the same database check further.
- [ ] A "my requests" read for signed in customers (seeing their own past Purohit bookings) was intentionally left out of this spec; revisit if requested later.
