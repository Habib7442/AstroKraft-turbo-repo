# Scope: AstroKraft Web Storefront

The customer facing Next.js storefront for AstroKraft, a Vedic astrology and lab certified gemstone D2C marketplace.

**Build approach:** Tracer Bullet (a thin path through every layer first, then thicken).
**Workflow:** Beta (`/check verify`, then `/test`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep the build orderly, not requirements. Skip anything that does not fit._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Purohit Booking | Slice 1 | in-progress |

## Slice 1: Purohit Booking

### 1. Purohit Booking · in-progress
A lead capture form so a visitor can request a puja (ritual) booking without paying up front; the AstroKraft team follows up directly to confirm the priest, materials, and price.
**Done when:** a visitor (signed in or anonymous) can submit the form, the team receives an email notification for each new request, and an admin can see and update every request's status in the admin app.
- [x] Design it (spec): `/architect purohit booking`
- [x] Build it: `/develop purohit booking`
   - [x] Migration + row level security: `purohit_bookings` table, admin only read/update policies (AC-3, AC-8, AC-9)
   - [x] Create + upload URL API routes: field validation, honeypot, phone based rate limit, R2 presigned upload (AC-1, AC-2, AC-5, AC-6, AC-7, AC-8)
   - [x] Team notification email (AC-4)
   - [x] Storefront form page + admin management screen (AC-1, AC-2, AC-3, AC-5, AC-8, AC-9)
- [ ] Verify it: `/check verify purohit booking`
- [ ] Test it: `/test purohit booking`
Spec [0001](../../specs/web/0001-purohit-booking/index.md) · code in `apps/web/src/app/[locale]/purohit-booking`, `apps/web/src/app/api/purohit-bookings`, `apps/admin/src/app/(dashboard)/purohit-bookings.tsx`, `supabase/migrations/20260908000000_add_purohit_bookings.sql`
