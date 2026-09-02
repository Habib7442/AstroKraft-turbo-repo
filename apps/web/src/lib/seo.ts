/**
 * seo.ts — Centralized SEO & metadata configuration for AstroKraft
 * ------------------------------------------------------------------
 * Import `constructMetadata()` in any `page.tsx`/`layout.tsx` to emit
 * Next.js Metadata (title, description, OG, Twitter, canonical, hreflang).
 * Import the JSON-LD builders and render them via a
 * <script type="application/ld+json"> tag on the relevant page.
 */

import type { Metadata, Viewport } from "next";
import { LOCALES, type Locale } from "@/lib/locales";

/* ============================================================================
 * 1. CORE SITE CONSTANTS
 * ==========================================================================*/

export const SITE = {
  name: "AstroKraft",
  legalName: "AstroKraft",
  /** Production origin — no trailing slash. */
  url: "https://www.astrokraft.online",
  title: "AstroKraft — Vedic Astrology & Gemstone Marketplace",
  description: "Authentic Vedic astrology services, lab-certified gemstones, Rudraksha, and Vastu solutions in Silchar.",
  /** Default share image (1200×630). */
  ogImage: "/og_image.jpg",
  themeColor: "#5B21B6",
  keywordsPrimary: [
    "vedic astrology",
    "certified gemstones",
    "lab certified gemstones online",
    "natural gemstone India",
    "rudraksha online India",
    "gemstone shop Silchar Assam",
    "astrologer in Silchar",
    "astrologer in Assam",
    "Vastu consultant Silchar"
  ],
  contact: {
    phone: "+916001730761",
    phoneDisplay: "+91 6001730761",
    email: "vastubipra@gmail.com",
    address: {
      street: "Rangirkhari",
      locality: "Silchar",
      region: "Cachar, Barak Valley, Assam",
      country: "IN",
      display: "Rangirkhari, Silchar, Cachar, Barak Valley, Assam"
    }
  },
  business: {
    udyamNumber: "UDYAM-AS-05-0058234",
    shopEstablishmentNumber: "SHE/2026/XG17769679846279K"
  }
} as const;

export const DEFAULT_LOCALE: Locale = "en";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_IN",
  bn: "bn_IN"
};

/* ============================================================================
 * 2. URL / hreflang HELPERS
 * ==========================================================================*/

/** Build a localized absolute URL for a given path + locale. */
export function localizedUrl(path = "/", locale: Locale = DEFAULT_LOCALE): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${SITE.url}/${locale}${clean}`;
}

/** languages map for Next.js `alternates.languages` (+ x-default). */
export function hreflangAlternates(path = "/"): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const locale of LOCALES) langs[locale] = localizedUrl(path, locale);
  langs["x-default"] = localizedUrl(path, DEFAULT_LOCALE);
  return langs;
}

function absoluteUrl(image?: string): string {
  const fallback = image || SITE.ogImage;
  return fallback.startsWith("http") ? fallback : `${SITE.url}${fallback.startsWith("/") ? "" : "/"}${fallback}`;
}

/* ============================================================================
 * 3. METADATA BUILDER  (the main helper for every page/layout)
 * ==========================================================================*/

export interface BuildMetaInput {
  title?: string;
  description?: string;
  /** Path WITHOUT locale prefix or origin, e.g. "/vedic-gemstones". */
  path?: string;
  locale?: Locale;
  /** Absolute or root-relative OG image. Defaults to SITE.ogImage. */
  image?: string;
  /** Keywords to merge with site defaults. */
  keywords?: readonly string[];
  /** Set true on cart/account pages you don't want indexed. */
  noIndex?: boolean;
  /**
   * Only the root layout should pass this. It establishes the
   * `{ default, template }` title pair that every page without its own
   * title inherits. Page-level calls must leave this false — otherwise
   * Next.js applies the template a second time on top of the default,
   * producing a duplicated title like "AstroKraft — X • AstroKraft".
   */
  root?: boolean;
}

/**
 * constructMetadata — returns a Next.js `Metadata` object.
 * Pages that pass `title` get an absolute "Title • AstroKraft" string.
 * Pages that don't pass `title` inherit the root layout's default
 * unchanged (no `title` key is set here at all).
 */
export function constructMetadata(input: BuildMetaInput = {}): Metadata {
  const {
    title,
    description = SITE.description,
    path = "/",
    locale = DEFAULT_LOCALE,
    image = SITE.ogImage,
    keywords = [],
    noIndex = false,
    root = false
  } = input;

  const canonical = localizedUrl(path, locale);
  const ogImage = absoluteUrl(image);
  const fullTitle = title ? `${title} • ${SITE.name}` : SITE.title;
  const mergedKeywords = Array.from(new Set([...SITE.keywordsPrimary, ...keywords]));

  const titleField: Metadata["title"] = root
    ? { default: SITE.title, template: `%s • ${SITE.name}` }
    : title
      ? { absolute: fullTitle }
      : undefined;

  return {
    metadataBase: new URL(SITE.url),
    ...(titleField ? { title: titleField } : {}),
    description,
    keywords: mergedKeywords,
    applicationName: SITE.name,
    authors: [{ name: SITE.name }],
    creator: SITE.name,
    publisher: SITE.name,
    alternates: {
      canonical,
      languages: hreflangAlternates(path)
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: canonical,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }]
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage]
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
        },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
      ],
      apple: "/apple-touch-icon.png"
    },
    manifest: "/site.webmanifest",
    category: "shopping",
    // Google Search Console's HTML-tag verification method — set
    // GOOGLE_SITE_VERIFICATION to the content value Search Console gives you
    // (Settings > Ownership verification > HTML tag). Only needs to render
    // once; root layout's metadata is inherited by every page.
    ...(root && process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {})
  };
}

/** Root `viewport` export (Next.js separates viewport/themeColor from metadata). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: SITE.themeColor
};

/* ============================================================================
 * 4. JSON-LD STRUCTURED DATA BUILDERS
 *    Render via: <script type="application/ld+json"
 *      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 * ==========================================================================*/

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    description: SITE.description,
    areaServed: "IN"
  };
}

/** WebSite + Sitelinks Search Box. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": ORG_ID },
    inLanguage: LOCALES
  };
}

/** Product schema for the certified gemstone store — render on product detail pages. */
export interface ProductSchemaInput {
  name: string;
  description: string;
  path: string;
  image?: string;
  priceINR: number;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  ratingValue?: number;
  reviewCount?: number;
}
export function productSchema(p: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: [absoluteUrl(p.image)],
    sku: p.sku,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: localizedUrl(p.path),
      priceCurrency: "INR",
      price: p.priceINR.toFixed(2),
      availability: `https://schema.org/${p.availability ?? "InStock"}`,
      seller: { "@id": ORG_ID }
    },
    ...(p.ratingValue && p.reviewCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingValue, reviewCount: p.reviewCount } }
      : {})
  };
}

/** Convenience: combine the global graph for the root layout. */
export function globalJsonLd() {
  return [organizationSchema(), websiteSchema()];
}
