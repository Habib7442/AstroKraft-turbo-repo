import type { MetadataRoute } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { localizedUrl, DEFAULT_LOCALE } from "@/lib/seo";
import { LOCALES } from "@/lib/locales";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/consultation", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 }
];

function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) languages[locale] = localizedUrl(path, locale);
  languages["x-default"] = localizedUrl(path, DEFAULT_LOCALE);
  return languages;
}

function entriesForPath(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap {
  const alternates = { languages: languageAlternates(path) };
  return LOCALES.map((locale) => ({
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
