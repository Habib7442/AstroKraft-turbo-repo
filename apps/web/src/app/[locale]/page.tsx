import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryStories } from "@/components/category-stories";
import { ProductShowcase } from "@/components/product-showcase";
import { AstrologerShowcase } from "@/components/astrologer-showcase";
import { LOCALES, isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";

export const revalidate = 60;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({ path: "/", locale: isValidLocale(locale) ? locale : "en" });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const supabase = getSupabaseClient();
  const [{ data: banners }, { data: categories }, { data: astrologers }, { data: consultationCategories }] = await Promise.all([
    supabase.from("promo_banners").select("*").eq("is_active", true).order("position", { ascending: true }),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("astrologers")
      .select("*, astrologer_categories(category_id)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(8),
    supabase.from("consultation_categories").select("id, name").eq("is_active", true)
  ]);

  const categoryNameById = new Map((consultationCategories ?? []).map((c) => [c.id, c.name]));

  const categoryShowcases = categories
    ? await Promise.all(
        categories.map(async (category) => {
          const { data: products } = await supabase
            .from("products")
            .select("*, categories!inner(name), product_variants(id, quality, price)")
            .eq("is_active", true)
            .eq("categories.slug", category.slug)
            .order("sort_order", { ascending: true })
            .limit(8);
          return { category, products: products ?? [] };
        })
      )
    : [];

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#F7F5FC]">
      <div
        className="w-full flex flex-col items-center"
        style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }}
      >
        {banners && banners.length > 0 ? (
          <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-2">
            <BannerCarousel banners={banners} />
          </div>
        ) : null}

        {categories && categories.length > 0 ? <CategoryStories categories={categories} locale={locale} /> : null}
      </div>

      {categoryShowcases.slice(0, 1).map(({ category, products }) =>
        products.length > 0 ? (
          <ProductShowcase
            key={category.id}
            title={category.name}
            subtitle={category.description}
            products={products}
            locale={locale}
            bgClassName="bg-background"
            exploreHref={`/${locale}/${category.slug}`}
            exploreLabel={`Explore All ${category.name} →`}
          />
        ) : null
      )}

      {astrologers && astrologers.length > 0 ? (
        <AstrologerShowcase
          astrologers={astrologers}
          categoryNameById={categoryNameById}
          locale={locale}
          bgClassName="bg-white"
        />
      ) : null}

      {categoryShowcases.slice(1).map(({ category, products }, index) =>
        products.length > 0 ? (
          <ProductShowcase
            key={category.id}
            title={category.name}
            subtitle={category.description}
            products={products}
            locale={locale}
            bgClassName={index % 2 === 0 ? "bg-background" : "bg-white"}
            exploreHref={`/${locale}/${category.slug}`}
            exploreLabel={`Explore All ${category.name} →`}
          />
        ) : null
      )}
    </main>
  );
}
