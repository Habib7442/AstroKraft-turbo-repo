# AstroKraft — Product Requirements Document (Rebuild)

**Version:** 1.0
**Date:** 31 August 2026
**Owner:** Habib Tanwir (Locallify)
**Status:** Draft for build

---

## 1. Summary

Rebuild AstroKraft — a Vedic astrology + gemstone marketplace based in Rangirkhari, Silchar — as a **Turborepo monorepo** containing a customer-facing **Next.js website** and a **React Native (Expo) admin app**, sharing one Supabase backend, one design system, and one set of business logic.

The current site is well built on the front end but has two structural gaps (surfaced in the audit): **there is no real online checkout** (every product routes to WhatsApp) and **no reviews / social-proof layer**. This rebuild fixes both by adding a full Razorpay checkout (including EMI), a ratings & reviews system, and structured SEO for local discovery — while preserving the existing brand, catalog, and free Vedic tools.

---

## 2. Goals & Non-Goals

### Goals
- One monorepo, two apps (web + admin), shared packages — no duplicated models or logic.
- Real online purchase flow with **Razorpay** (cards, UPI, netbanking, wallets, **EMI incl. Bajaj Finserv cardless EMI**).
- Keep WhatsApp as an *additional* channel, not the only path to buy.
- Add a **reviews & ratings** system (products + astrologers) with admin moderation.
- Preserve the current **brand colours and visual identity** exactly.
- Keep the mandatory canonical URL structure: **`https://www.astrokraft.online/en`** (locale always prefixed — see §12).
- Admin can manage the entire catalog, orders, consultations, content, and reviews **from a phone**.
- Strong local SEO (structured data, hreflang en/bn) to fix the audit's local-visibility gap.

### Non-Goals (this phase)
- Marketplace multi-vendor (single seller: AstroKraft).
- Native customer app (customers use the responsive website).
- In-house astrology computation engine if a reliable third-party API is available (see Open Questions).
- Replacing WhatsApp entirely.

---

## 3. Tech Stack

| Concern | Choice | Role |
|---|---|---|
| Monorepo | **Turborepo** + pnpm workspaces | Task orchestration, shared caching |
| Website | **Next.js (App Router)** | Storefront, SSR/SSG, SEO, checkout |
| Admin | **React Native + Expo** | Mobile admin (iOS/Android; Expo web optional) |
| Auth | **Clerk** | Customer + admin auth, sessions, roles |
| Database | **Supabase (Postgres)** | Data, RLS, storage of relational records |
| Object storage | **Cloudflare R2** | Product images, astrologer photos, blog media, lab certificates |
| Analytics | **PostHog** | Product analytics, funnels, session replay, feature flags |
| Client state | **Zustand** | Cart, filters, UI state (persisted) |
| Payments | **Razorpay** | Checkout, EMI, refunds, webhooks |
| i18n | **next-intl** (web) | en (default) + bn, always-prefixed routing |
| Validation | **Zod** (shared) | Runtime validation, shared web + admin |
| Styling (web) | Tailwind + shared theme tokens | Brand system |

> **Clerk + Supabase note:** use Clerk as the third-party auth provider for Supabase, so Clerk-issued JWTs drive Postgres **Row Level Security**. Confirm the current recommended integration path in Clerk + Supabase docs at build time (the JWT-template approach was superseded by a native integration — verify before wiring RLS).

---

## 4. Monorepo Structure

```
astrokraft/
├─ apps/
│  ├─ web/                # Next.js storefront (App Router, next-intl)
│  └─ admin/              # Expo admin app (expo-router)
├─ packages/
│  ├─ db/                 # Supabase client, generated types, SQL migrations, seed
│  ├─ auth/               # Clerk helpers, role guards, shared session utils
│  ├─ theme/              # brand tokens (colours, spacing, type) — same palette
│  ├─ validators/         # Zod schemas shared by web + admin
│  ├─ analytics/          # PostHog wrappers + typed event catalog
│  ├─ payments/           # Razorpay order/verify/refund helpers (server)
│  ├─ storage/            # R2 presigned upload/download helpers
│  ├─ core/               # domain logic: pricing, cart math, order state machine
│  └─ config/             # eslint, tsconfig, tailwind preset
└─ turbo.json
```

**Cross-platform reality:** Next.js (React DOM) and Expo (React Native) do **not** share UI primitives directly. Share **tokens, types, validators, and business logic** across both; keep **UI components platform-specific**. If unified components are later desired, evaluate Tamagui / react-native-web — but do not block v1 on it.

---

## 5. Apps

### 5.1 Website (Next.js) — customer-facing
Ports the current feature set, adds checkout + reviews.

- Home (hero CTA, category rails, bestsellers, services, astrologers, tools)
- Category listing: Gemstones, Rudraksha, Bracelets, Vastu Products
- Product detail page (PDP): variants (quality tiers), price, lab certificate, gallery, reviews, add-to-cart **and** WhatsApp inquiry
- Cart → Checkout → Razorpay → Order confirmation
- Astrologers: list, profile, **consultation booking + payment**
- Free Vedic Tools: Kundli / Birth Chart, Kundli Matching (Guna Milan), Daily Panchang; Daily Horoscope (behind feature flag)
- Blog (list + post)
- Account: orders, bookings, addresses, reviews (Clerk-gated)
- Static: About, Contact, Privacy, Terms

### 5.2 Admin (Expo) — internal
Runs on the founder's/staff phone.

- **Dashboard:** orders today, revenue, pending consultations, low stock
- **Catalog:** products + variants CRUD, image upload to R2, certificate upload, bestseller/status toggles
- **Orders:** list, detail, status transitions, refunds (via Razorpay)
- **Astrologers:** CRUD, availability, fees, languages
- **Consultations:** upcoming, mark complete/no-show
- **Reviews:** moderation queue (approve / reject)
- **Blog:** CRUD + publish
- **Coupons:** create/expire
- **Inquiries inbox:** captured WhatsApp/lead events
- **Push notifications** (Expo) on new order / new booking
- Admin access gated by Clerk role = `admin`

---

## 6. Data Model (Supabase / Postgres)

Core tables (indicative — refine in migrations). All user-scoped tables protected by RLS.

| Table | Key fields |
|---|---|
| `profiles` | `id` (= Clerk user id), `role` (`customer`/`admin`), `full_name`, `phone`, `locale`, `created_at` |
| `addresses` | `id`, `user_id`, `line1`, `city`, `state`, `pincode`, `phone`, `is_default` |
| `products` | `id`, `slug`, `type` (`gemstone`/`rudraksha`/`bracelet`/`vastu`), `name_en`, `name_bn`, `desc_en`, `desc_bn`, `unit` (`carat`/`piece`), `base_price`, `is_bestseller`, `status`, `seo_title`, `seo_desc` |
| `product_variants` | `id`, `product_id`, `quality` (`basic`/`semi_prem`/`premium`, nullable), `price`, `stock`, `sku` |
| `product_images` | `id`, `product_id`, `r2_key`, `alt`, `position` |
| `product_certificates` | `id`, `product_id` \| `variant_id`, `r2_key`, `lab_name`, `cert_number` |
| `astrologers` | `id`, `slug`, `name`, `photo_r2_key`, `specialization`, `languages` (text[]), `fee`, `bio_en`, `bio_bn`, `rating_avg`, `status` |
| `consultations` | `id`, `user_id`, `astrologer_id`, `scheduled_at`, `duration_min`, `channel` (`call`/`chat`/`video`), `fee`, `status`, `payment_id` |
| `orders` | `id`, `user_id`, `status` (state machine §8), `subtotal`, `discount`, `total`, `currency`, `payment_method`, `emi_plan`, `razorpay_order_id`, `razorpay_payment_id`, `address_id`, `created_at` |
| `order_items` | `id`, `order_id`, `product_id`, `variant_id`, `qty`, `unit_price`, `line_total`, `name_snapshot` |
| `carts` / `cart_items` | server-side cart for signed-in users (mirrors Zustand guest cart) |
| `reviews` | `id`, `user_id`, `product_id` \| `astrologer_id`, `rating` (1–5), `title`, `body`, `status` (`pending`/`approved`/`rejected`), `verified_purchase`, `created_at` |
| `inquiries` | `id`, `user_id?`, `product_id?`, `channel` (`whatsapp`), `message`, `created_at` |
| `blog_posts` | `id`, `slug`, `title_en/bn`, `body_en/bn`, `cover_r2_key`, `author`, `tags`, `published_at`, `status` |
| `coupons` | `id`, `code`, `type` (`flat`/`percent`), `value`, `min_order`, `usage_limit`, `expires_at` |
| `service_requests` | `id`, `user_id?`, `service` (`purohit`/`vastu_consult`/`vastu_home_plan`), `details`, `status` |

**RLS sketch:** customers read/write only their own `orders`, `consultations`, `reviews`, `addresses`; `products`, `astrologers`, approved `reviews`, `blog_posts` are public-read; all writes to catalog/content require `role = admin`.

---

## 7. Payments (Razorpay)

- **Flow:** create Razorpay Order **server-side** → open Checkout on client → on success, **verify signature** server-side (and via webhook) → transition order to `paid`.
- **Methods:** cards, UPI, netbanking, wallets, **Card EMI**, **Cardless EMI (Bajaj Finserv)** — the EMI options fulfil the client's Bajaj Finance EMI requirement for gemstone purchases.
- **Webhooks:** `payment.captured`, `payment.failed`, `refund.processed` → an API route (see §12) with signature verification against the webhook secret.
- **Refunds:** initiated from the admin app; call Razorpay refund API, reflect status on the order.
- **Domain constraint:** the Razorpay account is registered to **`https://www.astrokraft.online/en`**. Keep the customer-visible checkout under `/en`, and use that exact URL wherever the registered business/website URL is referenced. Confirm Bajaj cardless EMI is enabled on the Razorpay account.

---

## 8. Order State Machine

```
created → payment_pending → paid → processing → shipped → delivered
                        ↘ payment_failed
paid → refund_requested → refunded
any → cancelled
```

Consultations: `booked → paid → completed | no_show | cancelled`.

State transitions live in `packages/core` so web and admin share one source of truth.

---

## 9. Auth & Roles (Clerk)

- Customers sign in with Clerk (email/OTP/social as configured); a `profiles` row is created/mirrored on first sign-in via Clerk webhook.
- `role` claim drives access: `admin` unlocks the Expo app and all catalog/content writes; `customer` is default.
- Both apps use the same Clerk instance; the Expo app gates entry on `role = admin`.
- Clerk JWT feeds Supabase RLS (see stack note in §3).

---

## 10. Free Vedic Tools

Keep the current tools as top-of-funnel: **Kundli / Birth Chart**, **Kundli Matching (Guna Milan)**, **Daily Panchang**, plus **Daily Horoscope** (currently "Coming Soon" — ship behind a PostHog feature flag).

Decision needed (Open Questions): compute in-house vs. a third-party Vedic astrology API. Each tool run should emit a PostHog `tool_used` event for funnel analysis into consultation/gem purchases.

---

## 11. Media & Storage (Cloudflare R2)

- All images/certificates stored in R2; served via a public bucket behind a Cloudflare custom domain (e.g. `media.astrokraft.online`).
- **Uploads:** admin app requests a **presigned PUT** from a server helper in `packages/storage`, uploads directly to R2 (keeps large files off the API).
- Store only the `r2_key` in Postgres; resolve to a CDN URL at render time.
- Add the R2/CDN domain to Next.js `images.remotePatterns` for `next/image` optimisation.

---

## 12. Routing & i18n

- **next-intl**, locales `en` (default) + `bn`, **prefix strategy = always** → every URL is locale-prefixed. `/` redirects to `/en`.
- This makes **`https://www.astrokraft.online/en`** the canonical home and preserves the Razorpay-registered URL by construction. `bn` mirrors under `/bn`.
- Preserve existing public slugs for SEO: `/en/gemstones`, `/en/rudraksha`, `/en/astrologers`, `/en/tools/kundli`, `/en/blog`, etc.
- **API routes / webhooks** (Razorpay, Clerk) live outside the `[locale]` segment (e.g. `/api/webhooks/razorpay`) — they are not user-facing and are not locale-prefixed. The registered *business/website* URL remains the `/en` page.
- `hreflang` alternates for en/bn on every indexable page; canonical points to the `/en` variant.

---

## 13. Analytics (PostHog)

Typed event catalog in `packages/analytics`. Minimum events:

`page_viewed`, `product_viewed`, `add_to_cart`, `remove_from_cart`, `checkout_started`, `payment_succeeded`, `payment_failed`, `consultation_booked`, `tool_used` (kundli/matching/panchang), `whatsapp_inquiry_clicked`, `review_submitted`, `search_performed`.

Use PostHog for the purchase & booking funnels, session replay on checkout drop-off, and **feature flags** (Daily Horoscope, EMI banner, experiments).

---

## 14. State (Zustand)

- **Cart store** (guest cart persisted to localStorage; merged into server `carts` on sign-in).
- **Filter/sort store** for category pages.
- **UI store** (drawers, modals, locale toggle).
- Keep server data (catalog, orders) in server components / fetches — Zustand holds client/UI state, not the source of truth.

---

## 15. Non-Functional Requirements

- **SEO (fixes audit gap):** SSG/ISR for catalog & blog; JSON-LD for `Product`, `AggregateRating`/`Review`, `LocalBusiness` (Rangirkhari address, phone, hours), `BreadcrumbList`; `sitemap.xml`, `robots.txt`, hreflang, canonical `/en`.
- **Performance:** next/image + R2 CDN, ISR revalidation, edge caching; target good Core Web Vitals on mobile (primary audience).
- **Security:** RLS on every user table; Razorpay + Clerk webhook signature verification; secrets in env (never client); Zod-validate all inputs; no service-role key in the browser.
- **Reliability:** idempotent webhook handling (dedupe by event id); order marked paid only after verified signature.
- **Accessibility:** semantic headings, alt text (from `product_images.alt`), tap targets, colour contrast within the brand palette.

---

## 16. Design System

- **Preserve the current AstroKraft brand palette and typography exactly** — extract the existing colour tokens from the live site and codify them in `packages/theme` as the single source of truth for both apps. No re-theming in this rebuild.
- Theme package exposes tokens in a form consumable by Tailwind (web) and RN styles (admin).

---

## 17. Migration Plan (Sanity → Supabase, media → R2)

1. Export current content from Sanity (products, astrologers, blog, tools content).
2. Transform to the §6 schema; seed Supabase.
3. Copy media from the Sanity CDN into R2; rewrite references to `r2_key`.
4. **Preserve URLs** (`/en/gemstones`, product slugs, blog slugs) so existing SEO equity carries over; add 301s for any that change.
5. Verify structured data + sitemap before cutover; keep the old site reachable until DNS/verification is confirmed.

---

## 18. Delivery Phases

| Phase | Scope |
|---|---|
| **0 — Foundation** | Turborepo, pnpm, Clerk, Supabase schema + RLS, `theme`, next-intl (/en default), R2 helpers, PostHog init |
| **1 — Catalog + Reviews** | Category pages, PDP with variants + certificates, reviews (submit + moderation), SEO/structured data |
| **2 — Commerce** | Cart (Zustand + server), Razorpay checkout, **EMI**, orders, confirmation, refunds |
| **3 — Consultations** | Astrologer profiles, booking + payment, consultation lifecycle |
| **4 — Vedic Tools** | Kundli, Matching, Panchang; Daily Horoscope behind flag |
| **5 — Admin app (Expo)** | Full CRUD, orders, consultations, reviews queue, push notifications |
| **6 — Migrate & launch** | Content/media migration, analytics funnels, QA, cutover |

---

## 19. Success Metrics

- % of purchases completed **on-site** vs. WhatsApp (baseline today ≈ 0% on-site).
- Checkout conversion rate (PostHog funnel) and EMI adoption %.
- Number of approved reviews per month (baseline ≈ 0).
- Consultations booked & paid on-site per month.
- Organic local visibility (appearance for "gemstone / astrologer Silchar" — tracked separately, supported by structured data).

---

## 20. Open Questions

1. **Vedic tools compute** — build in-house or integrate a third-party astrology API? (Affects Phase 4 effort.)
2. **Consultation channel** — call, chat, or video, and via which provider? Does the astrologer confirm the slot manually?
3. **Bengali coverage** — full parity for all content, or storefront + key pages first?
4. **Inventory** — hard stock tracking for all products, or inquiry-only for high-variance gemstones (price by carat/quality)?
5. **Razorpay EMI** — confirm Bajaj cardless EMI is enabled on the account; any minimum cart value for EMI?
6. **Invoicing/GST** — is GST invoicing required at checkout?
7. **Admin app distribution** — internal via EAS/TestFlight/Play internal track, or store-published?

---

*Prepared for the AstroKraft rebuild. Stack, routing, and payment constraints reflect the requirements provided; items in §20 need sign-off before the affected phases begin.*
