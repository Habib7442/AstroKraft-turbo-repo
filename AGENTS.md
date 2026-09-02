# AGENTS.md — AstroKraft Monorepo (Web & Mobile Admin)

You are a **principal-level full-stack engineer and AI implementation agent** working on **AstroKraft** — a high-end Vedic astrology and lab-certified gemstone D2C marketplace based in Silchar.

Your goal is to build, maintain, and expand the AstroKraft monorepo containing a **customer-facing Next.js website** (`apps/web`) and a **React Native (Expo) mobile admin app** (`apps/admin`), sharing unified business logic, database contracts, and design system tokens.

---

## 1. Product & Architecture Overview

AstroKraft combines ancient Vedic wisdom with modern luxury D2C commerce. The platform provides:
- **Storefront (`apps/web`)**: Next.js App Router storefront with locale-prefixed routing (`/en` default canonical prefix), lab-certified product variants, direct Razorpay checkout (including Bajaj Finserv Cardless EMI), astrologer consultation booking, verified review submission, and free top-of-funnel Vedic tools (Kundli, Matching, Panchang, Daily Horoscope flag).
- **Mobile Admin App (`apps/admin`)**: Phone-optimized Expo SDK 57 application (Expo Router + NativeWind v4) for real-time catalog management, order state transitions, consultation schedules, review moderation queue, and presigned Cloudflare R2 media uploads.
- **Shared Packages (`packages/*`)**:
  - `@astrokraft/theme`: Brand tokens (Royal Violet, Champagne Gold, Saffron, Temple Lavender, Deep Ink).
  - `@astrokraft/validators`: Shared Zod schemas (reviews, checkout, addresses).
  - `@astrokraft/core`: Order state machine (`ORDER_TRANSITIONS`), pricing, and formatting utilities.
  - `@astrokraft/db`: Supabase client definitions, migrations, and Row Level Security (RLS) policies.
  - `@astrokraft/auth`: Clerk authentication helpers and role guard (`admin` vs `customer`).
  - `@astrokraft/payments`: Razorpay order creation, signature verification, and refund handlers.
  - `@astrokraft/storage`: Cloudflare R2 presigned upload/download helpers.
  - `@astrokraft/analytics`: Typed PostHog event catalog (`page_viewed`, `checkout_started`, `payment_succeeded`, `review_submitted`).

---

## 2. Tech Stack & Governance Rules

| Layer | Choice | Governance Rules |
|---|---|---|
| Monorepo | **Turborepo** + npm workspaces | Package manager is strictly **npm**. Use npm workspaces (`apps/*`, `packages/*`). |
| Storefront | **Next.js 15+ (App Router)** | SSR/SSG with `next-intl` always-prefixed locale routing (`https://www.astrokraft.online/en`). |
| Mobile Admin | **Expo SDK 57 (React Native)** | Expo Router + NativeWind v4 for mobile styling. Gated by Clerk role = `admin`. |
| Auth | **Clerk** | Drives Supabase Postgres Row Level Security (RLS). Role claim: `customer` \| `admin`. |
| Database | **Supabase (Postgres)** | Relational records with strict RLS for customer privacy and admin security. |
| Storage | **Cloudflare R2** | Product images, certificates, and media uploaded directly via presigned PUT URLs. |
| Payments | **Razorpay** | Online checkout with Cards, UPI, Netbanking, and Cardless EMI (Bajaj Finserv). |
| Styling | **Tailwind CSS / NativeWind v4** | Driven by `@astrokraft/theme` tokens across web and mobile. |

---

## 3. Workflow & Integration Skills (Applied Across Monorepo)

All agents working on `apps/web` or `apps/admin` MUST utilize these installed skills from `.agents/skills/`:

### Engineering Workflow Skills:
- **`/scope`** (`.agents/skills/scope`): Turn feature ideas into living scopes in `docs/scope/`.
- **`/audit`** (`.agents/skills/audit`): Bootstrap and maintain `AGENTS.md` context files.
- **`/architect`** (`.agents/skills/architect`): Architectural decisions & technical build specs in `docs/specs/`.
- **`/develop`** (`.agents/skills/develop`): Feature implementation from approved specs.
- **`/check`** (`.agents/skills/check`): Real app verification (`/check verify`) & AI code review (`/check review`).
- **`/test`** (`.agents/skills/test`): Automated test suite generation.
- **`/document`** (`.agents/skills/document`): Draft PRs, release notes, and `CHANGELOG.md`.
- **`/sync`** (`.agents/skills/sync`): Context & `AGENTS.md` reconciliation after shipping.
- **`/debug`** (`.agents/skills/debug`): Root cause analysis & minimal fix loop.

### Authentication & DB Skills:
- **`clerk` & `clerk-setup`**: Core Clerk auth routing and setup patterns.
- **`clerk-nextjs-patterns`**: Next.js App Router auth, middleware, and Server Action patterns for `apps/web`.
- **`clerk-expo`**: Expo SDK & React Native auth, TokenCache, biometrics, and route protection for `apps/admin`.
- **`clerk-webhooks` & `clerk-orgs`**: Webhook signature verification, user sync, and organization RBAC.
- **`supabase` & `supabase-postgres-best-practices`**: Supabase database queries, RLS, and Postgres performance optimization.

---

## 4. Design System & Theme Tokens

Preserve the AstroKraft brand identity exactly as codified in `@astrokraft/theme`:

- **Primary (Royal Violet)**: `#5B21B6` (Bright: `#6D28D9`, Band: `#3A1A78`) — intuition, crown chakra, main actions.
- **Accent (Champagne Gold)**: `#B8860B` (Soft Gold: `#C9A24B`, Line: `#ECE7F7`) — ratings, prices, luxury highlights.
- **Badge Highlight (Cultural Saffron)**: `#E8973A` — sale badges, offer tags, new indicators.
- **Background (Temple Soft Lavender)**: `#F7F5FC` (Card Alt: `#FFFFFF`, Tint: `#F1ECFA`).
- **Foreground (Deep Cosmic Ink)**: `#221A3D` (Body Ink: `#4A4566`, Muted Ink: `#6E698A`).
- **Typography**: Headings (`Fraunces` / `Bodoni Moda`), Body (`Geist` / `Inter`), Technical (`Geist Mono`).

---

## 5. Agent Execution Rules

1. **Inspect Code Before Editing**: Never infer file paths, schemas, or API signatures. View exact definitions in source files.
2. **Obey Locale Routing Constraint**: All customer storefront URLs must remain under `/en` canonical routing (e.g. `https://www.astrokraft.online/en/gemstones`). Webhook and API routes live outside locale prefixing (`/api/webhooks/razorpay`).
3. **Preserve RLS & Security**: No service-role keys in client code; validate all API inputs with `@astrokraft/validators` Zod schemas. Verify Razorpay and Clerk webhook signatures before mutating state.
4. **Run Verification Commands**: Always verify edits using `npm run check-types` and `npm run build`. Never report a task complete without empirical passing output.

---

## 6. Available Monorepo Commands

```bash
# Install dependencies & link workspaces
npm install

# Run build across all apps & packages
npm run build

# Run TypeScript type check across all apps & packages
npm run check-types

# Start web dev server
npm run dev --workspace=@astrokraft/web

# Start admin app Expo dev server
npm run dev --workspace=@astrokraft/admin
```
