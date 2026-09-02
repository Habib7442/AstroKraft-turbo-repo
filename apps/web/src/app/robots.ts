import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // No SEO value and always personalized/empty for a fresh crawler —
        // keep them out of the crawl budget entirely rather than relying on
        // noindex meta tags alone.
        disallow: ["/api/", "/*/cart", "/*/orders", "/*/search"]
      }
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url
  };
}
