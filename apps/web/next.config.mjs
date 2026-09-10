const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN).hostname
  : undefined;

// Origins this app's CLIENT-SIDE code actually loads scripts from, connects
// to, or embeds. First pass here was wrong on two fronts, found only after
// deploying and reading real browser console errors — see incident notes:
//   1. Clerk DOES load an external script from its own Frontend API domain
//      (clerk.astrokraft.online/npm/@clerk/clerk-js@6/... and .../ui@1/...)
//      — it is not bundled into the app's own JS as first assumed. Missing
//      that origin from script-src broke Clerk (and thus the whole app)
//      entirely.
//   2. Cloudflare injects its own Web Analytics beacon
//      (static.cloudflareinsights.com) at the edge on every response for a
//      Cloudflare-proxied domain — this isn't in the app's code at all, so
//      static analysis of the repo alone can't find it.
//   Also: Next.js's App Router itself emits inline <script> tags for RSC
//   streaming/hydration on every page (self.__next_f.push(...)). A static
//   (non-nonce) CSP has no way to selectively allow just those — Next's own
//   docs' non-nonce example also uses 'unsafe-inline' in script-src for
//   exactly this reason. The alternative (a per-request nonce via
//   middleware) requires converting every page to fully dynamic rendering
//   — no ISR/static generation, no CDN caching — which this app currently
//   relies on for its homepage/category pages; not something to switch to
//   as an incident fix without a deliberate decision.
//
//   SECURITY EXCEPTION — 'unsafe-inline' in script-src: this does mean CSP
//   provides no defense-in-depth against an inline-script XSS specifically
//   (it still restricts which *external* origins can load a script, and
//   still blocks e.g. an injected <script src="https://evil.example">).
//   Compensating controls for the inline-script case:
//     - React/JSX escapes every interpolated value by default; nothing in
//       this app renders raw, unescaped HTML from a template string.
//     - The only dangerouslySetInnerHTML usages in the whole app are the
//       three JSON-LD blocks (layout.tsx, products/[slug]/page.tsx) — all
//       type="application/ld+json" (never executed as script even if the
//       CSP allowed it), and now built via lib/seo.ts's toJsonLdString()
//       instead of plain JSON.stringify(), which escapes "<"/">"/"&" so an
//       embedded value (e.g. an admin-entered product description)
//       containing a literal "</script>" can't prematurely close the tag
//       and inject a real, executable <script> after it.
//     - No other template/string-concatenation HTML construction exists in
//       the codebase (verified by grep for dangerouslySetInnerHTML).
//   Revisit if a nonce-based CSP (see above) is ever adopted, or if any
//   future code adds a new dangerouslySetInnerHTML / raw HTML string sink
//   — that would need the same toJsonLdString-style escaping at minimum.
//
//   - checkout.razorpay.com: the Razorpay checkout.js widget
//     (src/lib/load-razorpay-script.ts). api.razorpay.com/
//     lumberjack.razorpay.com are Razorpay's own documented CSP
//     requirements for checkout.js's XHR calls and its 3DS/OTP iframe, not
//     directly visible in this repo.
//   - *.clerk.accounts.dev / clerk.astrokraft.online: Clerk's Frontend API
//     — dev instance uses the former, the production instance (decoded
//     from its pk_live_ key) uses the latter custom domain. img.clerk.com
//     is Clerk's user-avatar image host.
//   - svfhlhmrnoywfqmkcgue.supabase.co: this project's Supabase REST/Auth
//     API (NEXT_PUBLIC_SUPABASE_URL), called client-side via
//     createClerkSupabaseClient/createSupabaseClient.
//   - *.r2.cloudflarestorage.com: the browser PUTs directly to a presigned
//     R2 URL when uploading a purohit-booking attachment
//     (purohit-booking-form.tsx); media.astrokraft.online / pub-*.r2.dev
//     are where uploaded images are actually served from (next.config's
//     own images.remotePatterns below).
const isDev = process.env.NODE_ENV === "development";
const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://clerk.astrokraft.online https://*.clerk.accounts.dev https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://media.astrokraft.online https://pub-*.r2.dev https://*.razorpay.com https://img.clerk.com",
  "font-src 'self'",
  "connect-src 'self' https://svfhlhmrnoywfqmkcgue.supabase.co https://*.r2.cloudflarestorage.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://*.clerk.accounts.dev https://clerk.astrokraft.online",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Duplicates CSP's frame-ancestors below for older browsers that
          // don't support frame-ancestors — both are cheap to set together.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES }
        ]
      }
    ];
  },
  reactStrictMode: true,
  transpilePackages: [
    "@astrokraft/theme",
    "@astrokraft/validators",
    "@astrokraft/core",
    "@astrokraft/db",
    "@astrokraft/auth",
    "@astrokraft/payments",
    "@astrokraft/storage",
    "@astrokraft/analytics"
  ],
  images: {
    // R2 upload keys are timestamp-prefixed (e.g. 1788243301007-...), so a
    // given image URL never changes content once uploaded — safe to cache
    // the optimized output for a long time instead of re-fetching/re-processing
    // it on every page load.
    minimumCacheTTL: 31536000,
    // Next.js's defaults (8 device sizes up to 3840px, 8 image sizes down to
    // 16px) generate far more distinct transformations than this site ever
    // requests — every real `sizes` prop in the codebase is either a small
    // fixed thumbnail (48-240px) or caps out at desktop widths (~1920px),
    // never 2K/4K. Fewer buckets = fewer Image Optimization transformations
    // counted against the Vercel Hobby plan's monthly quota.
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.astrokraft.online"
      },
      // Some existing rows (e.g. banners uploaded via the r2-presign Supabase
      // Edge Function, which has its own R2_PUBLIC_DOMAIN secret) still store
      // R2's raw public dev URL instead of the custom media.astrokraft.online
      // domain — allow it too so those images keep rendering.
      {
        protocol: "https",
        hostname: "pub-*.r2.dev"
      },
      ...(r2PublicHostname && r2PublicHostname !== "media.astrokraft.online"
        ? [
            {
              protocol: "https",
              hostname: r2PublicHostname
            }
          ]
        : [])
    ]
  }
};

export default nextConfig;
