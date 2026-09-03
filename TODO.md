# Go-Live TODO — DNS + Production Services

Checklist for the meeting with the client (they have DNS access at GoDaddy).
Verified against live DNS on 2026-09-02 — see notes under each item for what
was actually checked, so you don't waste time re-verifying at the meeting.

**Domain**: `astrokraft.online`
**DNS host**: GoDaddy (`ns67.domaincontrol.com` / `ns68.domaincontrol.com`) — NOT Cloudflare, despite R2 being on Cloudflare. Any DNS record below gets added in the GoDaddy DNS panel unless noted otherwise.

---

## ✅ Already done — no action needed

- **Domain → Vercel**: `astrokraft.online` and `www.astrokraft.online` already resolve to Vercel (confirmed via two independent DNS resolvers). The site is live on the real domain already.
- **Google Search Console ownership**: a `google-site-verification=...` TXT record already exists on the apex domain. This means the domain is likely already verified in Search Console under whoever set that up — check who has access to that Search Console property before creating a new one. If it's not accessible, we can still verify via the `GOOGLE_SITE_VERIFICATION` env var method instead (already wired up in the codebase, just needs the value from Search Console pasted into Vercel).

---

## 🔲 DNS records to add (GoDaddy)

### 1. Resend (transactional email — order/consultation invoices)
Currently sending from Resend's sandbox sender (`onboarding@resend.dev`), which **only delivers to the Resend account's own inbox** — real customers get nothing right now. To fix:

1. In the Resend dashboard → **Domains** → **Add Domain** → `astrokraft.online` (or a subdomain like `mail.astrokraft.online` if you'd rather keep it separate from any future company email).
2. Resend will show you the exact records to add — typically an **MX**, an **SPF (TXT)**, and a **DKIM (TXT)** record. Add all of them in GoDaddy exactly as shown (don't guess at the values — copy them from Resend's screen).
3. Wait for Resend to mark the domain "Verified" (minutes to a few hours).
4. Set `RESEND_FROM_EMAIL` in Vercel's env vars to an address on that verified domain (e.g. `orders@astrokraft.online`), then redeploy.

> Note: I couldn't pre-fetch these exact record values — the API key in the project is a send-only restricted key that can't manage domains. Whoever has full Resend dashboard access needs to add the domain there first.

### 2. Clerk (auth — currently on a Development instance)
The app is running on Clerk **test keys** (`pk_test_...` / `sk_test_...`). Development instances work fine for testing but aren't meant for real end users. To go live:

1. In the Clerk dashboard, create a **Production instance** for this app.
2. Clerk's production setup wizard will ask you to add DNS records (typically CNAMEs like `clerk.astrokraft.online`, `accounts.astrokraft.online`, and email-related records like `clkmail` + a DKIM CNAME). Add whatever it shows — this only appears once you start the production setup, so there's nothing to pre-fetch.
3. Once verified, copy the new **live** `pk_live_...` / `sk_live_...` keys into Vercel env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), and set up a **new webhook endpoint** for the production instance pointing at `https://www.astrokraft.online/api/webhooks/clerk` — copy its signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
4. Redeploy after updating env vars.

### 3. Cloudflare R2 custom domain (`media.astrokraft.online`)
Product/astrologer images currently load from a temporary Cloudflare-assigned domain (`pub-xxxxx.r2.dev`), not the branded `media.astrokraft.online` the PRD calls for.

1. In the Cloudflare dashboard → R2 → your bucket → **Settings → Custom Domains** → add `media.astrokraft.online`.
2. **Caveat**: Cloudflare R2's one-click custom-domain flow generally expects the domain's DNS zone to actually live on Cloudflare. Since `astrokraft.online` is on GoDaddy nameservers, check what Cloudflare's UI actually asks for when you try this — it may want you to add a CNAME manually in GoDaddy instead, or it may require the zone to be on Cloudflare. Confirm in the dashboard before assuming either way.
3. Once resolved, update `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` in Vercel env vars to `https://media.astrokraft.online` and redeploy.

---

## 🔲 Razorpay — going live (not DNS, but do this at the same time)

Currently on Razorpay **test keys** (`rzp_test_...`). See the earlier conversation for the full checklist, summarized here:

1. Confirm full account activation (KYC/PAN/bank details) is complete in Razorpay — website approval alone isn't enough.
2. Switch the Razorpay dashboard to **Live Mode** and generate Live API keys (copy the Key Secret immediately — Razorpay only shows it once).
3. Set up a **separate webhook for Live Mode** under Account & Settings → Webhooks, pointing at `https://www.astrokraft.online/api/webhooks/razorpay` — copy its secret.
4. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars, redeploy.
5. Keep the current test keys in local `.env.local` for dev — don't overwrite them locally.

---

## After any of the above: remember `turbo.json`

Any new env var added to Vercel must also be added to `turbo.json`'s `globalEnv` array, or Turborepo silently strips it from the build (this already bit us once with `RESEND_API_KEY`). If a new var comes out of the Resend/Clerk/R2 work above and isn't already in that list, add it there too.

---

## Suggested order for the meeting

1. Resend domain (fastest, unblocks real invoice emails today).
2. Razorpay live mode (business-critical — real payments).
3. Clerk production instance (bigger lift, budget more time — the wizard is interactive).
4. R2 custom domain (cosmetic — image URLs work fine on the temp domain today, lowest priority).
