import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { GemstoneCatalog } from "@/components/gemstone-catalog";
import { constructMetadata } from "@/lib/seo";

export const revalidate = 60;

async function getCategory(slug: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return constructMetadata({
      title: "Not Found",
      path: `/${slug}`,
      locale: isValidLocale(locale) ? locale : "en",
      noIndex: true
    });
  }

  return constructMetadata({
    title: category.name,
    description: category.description || undefined,
    path: `/${category.slug}`,
    locale: isValidLocale(locale) ? locale : "en",
    image: category.image_url || undefined
  });
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const supabase = getSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, categories!inner(name), product_variants(id, quality, price)")
    .eq("is_active", true)
    .eq("categories.slug", slug)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:py-14">
        <Link href={`/${locale}`} className="text-xs font-semibold text-primary hover:underline">
          ← Back to home
        </Link>

        <div className="mt-4 mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 max-w-xl text-sm text-ink-body sm:text-base">{category.description}</p>
          ) : null}
        </div>

        {products && products.length > 0 ? (
          <GemstoneCatalog products={products} locale={locale} />
        ) : (
          <p className="text-sm text-ink-body">No items available in this category right now.</p>
        )}
      </div>
    </main>
  );
}
