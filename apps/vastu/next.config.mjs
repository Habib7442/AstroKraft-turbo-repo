// Origins the client loads from (see apps/web/next.config.mjs for why a
// static CSP needs 'unsafe-inline' in script-src under the App Router):
//   - Cal.com: embed.js script + the booking iframe. Cloud uses cal.com / app.cal.com; a self-hosted
//     instance is whatever NEXT_PUBLIC_CAL_ORIGIN points at.
//   - Razorpay: checkout.js, its API/3DS iframes and logging endpoint (the
//     same origins apps/web allows).
//   - Meta Pixel: connect.facebook.net (fbevents.js), www.facebook.com (the
//     pixel's image/XHR beacon).
//   - YouTube: thumbnails (i.ytimg.com) and the click-to-play player on the
//     privacy-enhanced youtube-nocookie.com domain (components/video-stories.tsx).
//   - static.cloudflareinsights.com: injected at the edge if proxied by
//     Cloudflare.
const calOrigin = process.env.NEXT_PUBLIC_CAL_ORIGIN || "https://cal.com";
const calSources = Array.from(new Set(["https://cal.com", "https://app.cal.com", calOrigin])).join(" ");
const isDev = process.env.NODE_ENV === "development";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${calSources} https://checkout.razorpay.com https://connect.facebook.net https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.facebook.com https://*.razorpay.com https://i.ytimg.com",
  "font-src 'self'",
  `connect-src 'self' ${calSources} https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://www.facebook.com https://connect.facebook.net`,
  `frame-src ${calSources} https://checkout.razorpay.com https://api.razorpay.com https://www.youtube-nocookie.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@astrokraft/db", "@astrokraft/payments", "@astrokraft/validators"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES }
        ]
      }
    ];
  }
};

export default nextConfig;
