const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN).hostname
  : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
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
