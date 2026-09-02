import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { GemstoneCard, type ProductWithRelations } from "@/components/gemstone-card";
import { AstrologerCard, type AstrologerCardData } from "@/components/astrologer-card";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Search",
    path: "/search",
    locale: isValidLocale(locale) ? locale : "en",
    noIndex: true
  });
}

export default async function SearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const query = (q ?? "").trim();
  let products: ProductWithRelations[] = [];
  let astrologers: AstrologerCardData[] = [];
  let categoryNameById = new Map<string, string>();

  if (query) {
    const supabase = getSupabaseClient();
    // A generic "astrologer(s)" query isn't a name/bio match against any
    // particular astrologer — treat it as a request to browse all of them,
    // the same way it would if the user had clicked "Book Consultation".
    const isGenericAstrologerQuery = /^astrologers?$/i.test(query);

    let astrologerQuery = supabase
      .from("astrologers")
      .select("*, astrologer_categories(category_id)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (!isGenericAstrologerQuery) {
      astrologerQuery = astrologerQuery.or(`name.ilike.%${query}%,bio.ilike.%${query}%`);
    }

    // A query like "gemstones" is a category name, not any single product's
    // title (e.g. "Ruby (Manik)") — resolve matching categories first so
    // browsing by category name works the same as browsing by product name.
    const { data: matchingCategories } = await supabase.from("categories").select("id").ilike("name", `%${query}%`);
    const matchingCategoryIds = (matchingCategories ?? []).map((c) => c.id);

    let productFilter = `title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`;
    if (matchingCategoryIds.length > 0) {
      productFilter += `,category_id.in.(${matchingCategoryIds.join(",")})`;
    }

    const [{ data: productData }, { data: astrologerData }, { data: categoryData }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name), product_variants(id, quality, price)")
        .eq("is_active", true)
        .or(productFilter)
        .order("sort_order", { ascending: true }),
      astrologerQuery,
      supabase.from("consultation_categories").select("id, name").eq("is_active", true)
    ]);
    products = (productData as ProductWithRelations[]) ?? [];
    astrologers = (astrologerData as AstrologerCardData[]) ?? [];
    categoryNameById = new Map((categoryData ?? []).map((c) => [c.id, c.name]));
  }

  const totalResults = products.length + astrologers.length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:py-14">
        <Link href={`/${locale}`} className="text-xs font-semibold text-primary hover:underline">
          ← Back to home
        </Link>

        <div className="mt-4 mb-10">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            {query ? `Search results for "${query}"` : "Search"}
          </h1>
          <p className="mt-2 text-sm text-ink-body">
            {query
              ? `${totalResults} result${totalResults === 1 ? "" : "s"} found`
              : "Type something in the search bar above to find products or astrologers."}
          </p>
        </div>

        {totalResults > 0 ? (
          <div className="flex flex-col gap-12">
            {astrologers.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Astrologers</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                  {astrologers.map((astrologer) => (
                    <Link key={astrologer.id} href={`/${locale}/consultation?astrologer=${astrologer.id}`}>
                      <AstrologerCard astrologer={astrologer} categoryNameById={categoryNameById} />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {products.length > 0 ? (
              <div>
                {astrologers.length > 0 ? (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Products</h2>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                  {products.map((product) => (
                    <GemstoneCard key={product.id} product={product} locale={locale} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">💎</div>
            <h3 className="font-serif text-lg font-bold text-foreground">No results found</h3>
            <p className="max-w-sm text-sm text-ink-body">
              We couldn&rsquo;t find anything matching &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
