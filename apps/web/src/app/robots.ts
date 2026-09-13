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
        //
        // /*/consultation?category=*: every category/astrologer card links
        // here (homepage, search results) to deep-link straight into that
        // category's booking flow — real, useful for a human visitor, but
        // each one is a distinct crawlable URL whose own canonical tag
        // already points back to the bare /consultation page. Blocking the
        // crawl outright (rather than just relying on the canonical) stops
        // wasted crawl budget at the source — same reasoning that applied to
        // the old ?astrologer= links this replaced (GSC previously flagged
        // those as "Crawled - currently not indexed").
        disallow: ["/api/", "/*/cart", "/*/orders", "/*/search", "/*/consultation?category=*"]
      }
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url
  };
}
