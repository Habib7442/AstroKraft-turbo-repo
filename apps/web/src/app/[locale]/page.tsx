import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabase";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryStories } from "@/components/category-stories";
import { ConsultationCategoryShowcase } from "@/components/consultation-category-showcase";
import { HeroSection } from "@/components/hero-section";
import { ProductShowcase } from "@/components/product-showcase";
import { AstrologerShowcase } from "@/components/astrologer-showcase";
import { PurohitBookingCta } from "@/components/purohit-booking-cta";
import { LOCALES, isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";

// 5 min rather than 1 min: this page re-runs several parallel Supabase
// queries (banners, categories, astrologers, consultation categories, plus
// a per-category products query) on every regeneration - a 1-minute window
// meant near-constant re-renders under any regular crawl/bot traffic hitting
// it every 60-90s, since almost every hit landed just past the previous
// cache expiry. Catalog/pricing changes still show up within 5 minutes.
export const revalidate = 300;

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
    // A category with no price set yet can't actually be booked -
    // create-consultation-order rejects it once the customer reaches
    // checkout - so it's excluded here (both from the clickable category
    // grid below, and from categoryNameById, which also gates which
    // category an astrologer's "Book Now" link can deep-link to).
    supabase.from("consultation_categories").select("*").eq("is_active", true).gt("price", 0).order("sort_order", { ascending: true })
  ]);

  const categoryNameById = new Map((consultationCategories ?? []).map((c) => [c.id, c.name]));

  const categoryShowcases = categories
    ? await Promise.all(
        categories.map(async (category) => {
          const { data: products } = await supabase
            .from("products")
            .select("*, categories!inner(name), product_variants(id, quality, price, original_price)")
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
        className="relative w-full flex flex-col items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }}
      >
        {/* Cosmic overlay texture spans this whole block (hero text +
            "Shop by Category" below it), not just the hero's own box — one
            continuous background, not a seam partway down. Sits on top of
            the purple gradient above (kept exactly as-is), at the lower end
            of the requested 0.5-0.7 opacity range since the image's own
            colors (teal/green/gold) are quite different from the site's
            purple and would otherwise compete with it as the dominant
            color instead of reading as texture. */}
        <Image src="/hero-section-overlay.png" alt="" fill priority className="object-cover opacity-50" />
        {/* Scrim for guaranteed text contrast over the image - also mutes
            the image's non-purple colors back toward the brand purple. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(rgba(42,30,92,0.55), rgba(20,15,40,0.65))" }}
        />

        <div className="relative z-10 w-full flex flex-col items-center">
          <HeroSection locale={locale} />

          {categories && categories.length > 0 ? <CategoryStories categories={categories} locale={locale} /> : null}
        </div>
      </div>

      {consultationCategories && consultationCategories.length > 0 ? (
        <ConsultationCategoryShowcase categories={consultationCategories} locale={locale} />
      ) : null}

      {banners && banners.length > 0 ? (
        <div className="w-full max-w-7xl mx-auto px-6 pt-8">
          <BannerCarousel banners={banners} />
        </div>
      ) : null}

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

      <PurohitBookingCta locale={locale} />

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
