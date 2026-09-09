# 0001. Purohit Booking — Rationale

See [index.md](./index.md) for the build spec (requirements, decision, feature design, build plan).

## Context

The storefront already has a paid booking flow for astrologer consultations (Clerk sign in required, Razorpay checkout, a `consultations` table). Purohit Booking is a different kind of request: the price and priest are not fixed in advance, so there is nothing to check out. The job here is pure lead capture, get enough detail from the visitor that the team can call them back and quote a price, not process a payment.

The main forces at play: keeping the funnel frictionless (a puja inquiry is a considered, often family led purchase; requiring an account first would lose visitors), reusing what the project already runs (Clerk, Supabase Postgres with row level security, Cloudflare R2, Resend) rather than adding anything new, and keeping a public, unauthenticated write endpoint safe from spam without adding new infrastructure.

There is no payment, refund, or PCI (card data) scope in this feature; the stakeholder confirmed this explicitly. The data collected (name, phone, address, and an optional file) is ordinary customer PII, handled the same way the existing `orders` and `consultations` tables already handle it.

## Options considered

### Option 1: Server side API route with a service role write (recommended)

A Next.js API route validates the submission with a Zod schema and writes it using the Supabase service role client, the same shape as the existing `create-order` and `create-consultation-order` routes. Row level security (RLS) never grants a public insert policy; the route itself is the only door in.

**Pros**:
- Matches every other write path already in this codebase; nothing new to learn
- Validation, the honeypot check, the rate limit, and the notification email all live in one server side place, easy to reason about and change
- RLS on `purohit_bookings` stays simple: admin only, no public insert policy to get wrong

**Cons**:
- An extra network hop (browser to Next.js route to Supabase) compared to a direct client insert; irrelevant at this traffic volume

### Option 2: Public RLS insert policy, direct client write

The browser inserts straight into `purohit_bookings` using the Supabase anon key and a public "anyone can insert" RLS policy.

**Pros**:
- One less API route to write and maintain
- Slightly lower latency (no intermediate server hop)

**Cons**:
- A public insert policy is a much wider spam surface than a rate limited API route, and this codebase has no precedent for public inserts anywhere else
- Validation, the honeypot check, and the notification email would all have to move to a Postgres trigger or a client side check that a bot can just skip
- Inconsistent with how every other write in this app works, a real cost when someone unfamiliar with this one exception has to maintain it later

## Rationale

Every other write in this codebase (orders, consultations, reviews) goes through a server side route backed by the service role client, with row level security scoped to `is_admin()` for anything an admin needs to see. Option 1 keeps Purohit Booking on that same, already proven path instead of introducing the one public insert policy in the whole schema. Since this endpoint is unauthenticated by design (AC lets an anonymous visitor submit), putting validation, the honeypot check, and the rate limit inside a server route is also the only place they can actually be enforced; a public RLS policy has no equivalent hook for any of that.
