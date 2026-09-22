import type { MetadataRoute } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { localizedUrl, hreflangAlternates, INDEXABLE_LOCALES } from "@/lib/seo";
import { SIGNS } from "@/lib/astro/core";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/consultation", changeFrequency: "weekly", priority: 0.9 },
  { path: "/horoscope", changeFrequency: "daily", priority: 0.8 },
  { path: "/free-kundli", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gemstone-recommendation", changeFrequency: "monthly", priority: 0.8 },
  { path: "/testimonials", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 }
];

function entriesForPath(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap {
  const alternates = { languages: hreflangAlternates(path) };
  return INDEXABLE_LOCALES.map((locale) => ({
    url: localizedUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    alternates
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug, created_at").eq("is_active", true),
    supabase.from("products").select("slug, updated_at").eq("is_active", true)
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of STATIC_PATHS) {
    entries.push(...entriesForPath(path, new Date(), changeFrequency, priority));
  }

  for (const sign of SIGNS) {
    entries.push(...entriesForPath(`/horoscope/${sign.id}`, new Date(), "daily", 0.7));
    entries.push(...entriesForPath(`/gemstone-recommendation/${sign.id}`, new Date(), "monthly", 0.7));
  }

  for (const category of categories ?? []) {
    entries.push(
      ...entriesForPath(`/${category.slug}`, category.created_at ? new Date(category.created_at) : new Date(), "weekly", 0.8)
    );
  }

  for (const product of products ?? []) {
    entries.push(
      ...entriesForPath(
        `/products/${product.slug}`,
        product.updated_at ? new Date(product.updated_at) : new Date(),
        "weekly",
        0.7
      )
    );
  }

  return entries;
}
