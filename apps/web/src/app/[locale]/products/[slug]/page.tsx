import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductVariant } from "@astrokraft/db";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { TierSelector } from "@/components/tier-selector";
import { constructMetadata, productSchema } from "@/lib/seo";

export const revalidate = 60;

interface ProductDetail extends Product {
  categories: { name: string; slug: string } | null;
  product_variants: ProductVariant[];
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name, slug), product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data as ProductDetail | null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return constructMetadata({ title: "Product Not Found", path: `/products/${slug}`, locale: isValidLocale(locale) ? locale : "en", noIndex: true });
  }

  return constructMetadata({
    title: product.title,
    description: product.subtitle || product.description || undefined,
    path: `/products/${product.slug}`,
    locale: isValidLocale(locale) ? locale : "en",
    image: product.images?.[0]
  });
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const typedProduct = await getProduct(slug);

  if (!typedProduct) {
    notFound();
  }

  const variants = typedProduct.product_variants.filter((v) => v.quality);
  const prices = typedProduct.product_variants.map((v) => v.price).filter((p) => typeof p === "number");
  const inStock = typedProduct.product_variants.some((v) => v.stock > 0);

  const schema = productSchema({
    name: typedProduct.title,
    description: typedProduct.subtitle || typedProduct.description || `${typedProduct.title} — lab-certified, ritual-ready gemstone from AstroKraft.`,
    path: `/products/${typedProduct.slug}`,
    image: typedProduct.images?.[0],
    priceINR: prices.length > 0 ? Math.min(...prices) : 0,
    availability: inStock ? "InStock" : "OutOfStock",
    ratingValue: typedProduct.rating,
    reviewCount: typedProduct.review_count
  });

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <Link href={`/${locale}`} className="text-xs font-semibold text-primary hover:underline">
          ← Back to home
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-2 lg:py-12">
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-surface-border bg-surface-tint">
            {typedProduct.images?.[0] ? (
              <Image
                src={typedProduct.images[0]}
                alt={typedProduct.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl">💎</div>
            )}
            {typedProduct.is_featured ? (
              <span className="absolute right-3 top-3 rounded-full bg-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                Bestseller
              </span>
            ) : null}
          </div>

          {typedProduct.images && typedProduct.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {typedProduct.images.map((src, idx) => (
                <div key={idx} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-surface-border">
                  <Image src={src} alt={`${typedProduct.title} ${idx + 1}`} fill sizes="64px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {typedProduct.categories?.name ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{typedProduct.categories.name}</span>
          ) : null}

          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{typedProduct.title}</h1>
            {typedProduct.subtitle ? <p className="mt-1 text-base text-ink-body">{typedProduct.subtitle}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-ink-muted">
              <span className="text-gold">★</span> {typedProduct.rating} ({typedProduct.review_count} reviews)
            </span>
            {typedProduct.emi_available ? (
              <span className="whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                EMI Available
              </span>
            ) : null}
          </div>

          {typedProduct.description ? (
            <p className="text-sm leading-relaxed text-ink-body">{typedProduct.description}</p>
          ) : null}

          <TierSelector variants={variants} product={typedProduct} />
        </div>
      </div>
    </main>
  );
}
