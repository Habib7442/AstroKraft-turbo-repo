import { getSupabaseClient } from "@/lib/supabase";
import { GEMSTONES, type GemstoneInfo } from "@/lib/astro/gemstones";
import type { PlanetId } from "@/lib/astro/core";

export interface GemstoneProductLink {
  slug: string;
  title: string;
  price: number | null;
}

// One query for the whole category, cached per-request by fetch dedupe isn't
// available here (this runs server-side, not via fetch), so callers should
// call this once per page and reuse the map rather than once per planet.
export async function loadGemstoneProductMap(): Promise<Map<PlanetId, GemstoneProductLink>> {
  const supabase = getSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "vedic-gemstones")
    .eq("is_active", true)
    .maybeSingle();

  const map = new Map<PlanetId, GemstoneProductLink>();
  if (!category) return map;

  const { data: products } = await supabase
    .from("products")
    .select("slug, title, product_variants(price)")
    .eq("category_id", category.id)
    .eq("is_active", true);

  if (!products) return map;

  for (const planet of Object.keys(GEMSTONES) as PlanetId[]) {
    const gem: GemstoneInfo = GEMSTONES[planet];
    const match = products.find((p) => gem.keywords.some((kw) => p.title.toLowerCase().includes(kw)));
    if (!match) continue;
    const prices = (match.product_variants ?? [])
      .map((v: { price: number }) => v.price)
      .filter((p: number) => typeof p === "number");
    map.set(planet, { slug: match.slug, title: match.title, price: prices.length ? Math.min(...prices) : null });
  }

  return map;
}
