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
        // /*/consultation?astrologer=*: every astrologer card links here
        // (search results, homepage showcase) to deep-link straight into
        // that astrologer's booking flow — real, useful for a human visitor,
        // but each one is a distinct crawlable URL whose own canonical tag
        // already points back to the bare /consultation page. Google was
        // dutifully crawling every single one anyway (GSC: "Crawled -
        // currently not indexed", climbing as astrologers get added) before
        // respecting that canonical and discarding it — pure wasted crawl
        // budget with zero indexing upside. Blocking the crawl outright
        // (rather than just relying on the canonical) stops that at the
        // source.
        disallow: ["/api/", "/*/cart", "/*/orders", "/*/search", "/*/consultation?astrologer=*"]
      }
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url
  };
}
