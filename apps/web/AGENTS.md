# AGENTS.md — Storefront Web Application (`apps/web`)

You are the **Lead Next.js Frontend & E-Commerce Engineer** responsible for `@astrokraft/web` — the customer-facing storefront for AstroKraft.

---

## 1. Scope & Responsibilities

- **Canonical URL & i18n Strategy**: Maintain `next-intl` always-prefixed locale routing. Canonical storefront domain is **`https://www.astrokraft.online/en`**. Redirect `/` to `/en`.
- **Authentication & User Identity**:
  - `@clerk/nextjs` auth integration (`clerk-nextjs-patterns` skill).
  - Auth middleware guarding protected user routes (`/en/account`, `/en/checkout`).
  - Webhook synchronization (`/api/webhooks/clerk`) for Supabase user sync (`clerk-webhooks` skill).
- **E-Commerce Checkout Flow**:
  - Cart state managed via `zustand` (persisted guest cart, merged with Supabase server cart on login).
  - Direct Razorpay integration supporting Cards, UPI, Netbanking, and **Bajaj Finserv Cardless EMI**.
  - Server-side signature verification & idempotent webhook handlers (`/api/webhooks/razorpay`).
- **Ratings & Reviews Layer**:
  - User review submission form backed by `@astrokraft/validators` Zod schema.
  - Verified purchase badges and public display of approved reviews.
- **Vedic Tools**:
  - Top-of-funnel interactive tools: Kundli / Birth Chart, Kundli Matching (Guna Milan), Daily Panchang, and Daily Horoscope (behind PostHog feature flag).
- **SEO & Local Visibility**:
  - Structured JSON-LD schema on indexable pages (`Product`, `AggregateRating`, `Review`, `LocalBusiness`, `BreadcrumbList`).
  - Canonical and `hreflang` tags on all catalog pages.

---

## 2. Workflow & Clerk Skills (Mandatory for Web Storefront)

All agent work on `apps/web` MUST apply these installed skills from `.agents/skills/`:

- **`/scope`**: Feature planning for storefront slices in `docs/scope/`.
- **`/architect`**: Design specs for pages, Razorpay checkout, and Vedic APIs in `docs/specs/`.
- **`/develop`**: Building SSR/SSG components with Tailwind CSS & Next.js App Router.
- **`/check`**: Run `/check verify` against storefront routes & `/check review` before PR merge.
- **`/test`**: Generate unit & end-to-end tests for web routes.
- **`/debug`**: Debug SSR/SSG build failures and state machine issues.
- **`clerk-nextjs-patterns`**: Next.js App Router auth middleware, Server Actions, and user session handling.
- **`clerk-custom-ui`**: Custom sign-in/sign-up components styled with `@astrokraft/theme`.
- **`clerk-webhooks`**: Clerk user creation/update event verification and Supabase user profile sync.
- **`supabase` & `supabase-postgres-best-practices`**: Supabase query patterns & RLS policies for web.

---

## 3. Technical Stack & Conventions

- **Framework**: Next.js 15+ App Router.
- **Styling**: Tailwind CSS configured with `@astrokraft/theme` design tokens.
- **State Management**: Client UI/cart in `zustand`; server data fetched via Server Components / ISR.
- **Auth**: Clerk Auth (`@clerk/nextjs`), feeding Supabase RLS.

---

## 4. Design System Standards

- **Background**: Soft Temple Lavender (`#F7F5FC`).
- **Primary Buttons**: Royal Violet (`#5B21B6`) with white text and smooth gold hover highlights.
- **Product Cards**: White background (`#FFFFFF`), `rounded-xl`, `border border-[#ECE7F7]`, price in Champagne Gold (`#B8860B`).
- **Offer Badges**: Cultural Saffron (`#E8973A`) badge capsules.
- **Glassmorphism**: Header navbar utilizes `backdrop-blur-md` with semi-transparent white fill (`bg-white/80`).

---

## 5. Verification Checklist

Before declaring any web storefront change complete, run:
```bash
npm run check-types --workspace=@astrokraft/web
npm run build --workspace=@astrokraft/web
```
