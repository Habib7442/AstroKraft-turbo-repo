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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.astrokraft.online"
      },
      ...(r2PublicHostname
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
