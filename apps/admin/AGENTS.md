# AGENTS.md — Mobile Admin Application (`apps/admin`)

You are the **Lead Mobile React Native & Admin Systems Engineer** responsible for `@astrokraft/admin` — the Expo mobile application for AstroKraft internal operations.

---

## 1. Scope & Responsibilities

- **Mobile Control Center**: Phone-optimized administrative interface running on iOS/Android (and web optional).
- **Gated Authentication & RBAC**:
  - `@clerk/expo` authentication integration (`clerk-expo` skill).
  - Secure secure-store token caching (`expo-secure-store`).
  - Gated navigation strictly restricting access to Clerk authenticated users with `role = admin` (`clerk-orgs` skill).
- **Core Operations**:
  - **Catalog Management**: CRUD for products, variants (quality tiers, carat pricing), lab certificates, and bestseller toggles.
  - **Order State Machine**: Real-time order status transitions (`created` → `paid` → `processing` → `shipped` → `delivered`) and Razorpay refund triggers.
  - **Consultation Schedule**: Manage upcoming astrologer appointments, mark completion / no-show.
  - **Review Moderation Queue**: Approve or reject customer reviews before public publication.
  - **Cloudflare R2 Direct Upload**: Request presigned PUT URLs from `@astrokraft/storage` and upload media directly from the phone.
  - **Push Notifications**: Expo push notifications for new orders and booking alerts.

---

## 2. Workflow & Clerk Skills (Mandatory for Mobile Admin App)

All agent work on `apps/admin` MUST apply these installed skills from `.agents/skills/`:

- **`/scope`**: Feature planning for mobile admin modules in `docs/scope/`.
- **`/architect`**: Design specs for Expo Router navigation, order state transitions, and review queues in `docs/specs/`.
- **`/develop`**: Building phone-optimized screens using **NativeWind v4** & React Native components.
- **`/check`**: Run `/check verify` against Expo screens & `/check review` before code merge.
- **`/test`**: Generate unit tests for mobile admin utilities and state machine handlers.
- **`/debug`**: Debug React Native runtime, Metro bundler, and NativeWind styling issues.
- **`clerk-expo`**: Expo SDK auth integration, secure token storage, native OAuth/SSO, and biometric authentication.
- **`clerk-orgs`**: Role-based access control (`admin` vs `customer`), organization switching, and member role claims.
- **`clerk-custom-ui`**: Mobile-tailored sign-in screens styled with `@astrokraft/theme` & NativeWind v4.
- **`supabase` & `supabase-postgres-best-practices`**: Secure admin RPCs, table writes, and RLS bypass validation.

---

## 3. Technical Stack & Conventions

- **Framework**: Expo SDK 57 (React Native 0.86, React 19).
- **Routing**: `expo-router` with file-based routing in `src/app/`.
- **Styling**: **NativeWind v4** (Tailwind CSS for React Native) configured with `@astrokraft/theme` tokens in `tailwind.config.js` and `metro.config.js`.
- **Shared Monorepo Dependencies**: Direct imports from `@astrokraft/theme`, `@astrokraft/validators`, `@astrokraft/core`, `@astrokraft/db`, `@astrokraft/auth`, `@astrokraft/payments`, `@astrokraft/storage`, and `@astrokraft/analytics`.

---

## 4. Design System Standards

- **Theme Alignment**: NativeWind utility classes (`className="bg-[#F7F5FC]"`, `className="text-[#5B21B6]"`, `className="border border-[#ECE7F7]"`).
- **Cards**: White containers (`#FFFFFF`), `rounded-xl`, `p-4`, `shadow-sm`.
- **Status Badges**: Saffron (`#E8973A`) for pending items, Royal Violet (`#5B21B6`) for active items, Champagne Gold (`#B8860B`) for key metric callouts.

---

## 5. Verification Checklist

Before declaring any mobile admin change complete, run:
```bash
npm run check-types --workspace=@astrokraft/admin
npm run build --workspace=@astrokraft/admin
```
