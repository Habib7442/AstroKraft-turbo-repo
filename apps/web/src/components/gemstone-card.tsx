import Image from "next/image";
import Link from "next/link";
import type { Product } from "@astrokraft/db";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { inferCartCategory } from "@/lib/cart-category";

export interface ProductVariantRow {
  id: string;
  quality: string | null;
  price: number;
}

export interface ProductWithRelations extends Product {
  categories: { name: string } | null;
  product_variants: ProductVariantRow[];
}

const TIER_LABELS: Record<string, string> = {
  basic: "Basic",
  semi_prem: "Semi-Prem",
  premium: "Premium"
};

const TIER_ORDER = ["basic", "semi_prem", "premium"];

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

interface GemstoneCardProps {
  product: ProductWithRelations;
  locale: string;
  className?: string;
}

export function GemstoneCard({ product, locale, className = "" }: GemstoneCardProps) {
  const tiers = product.product_variants
    .filter((v) => v.quality && typeof v.price === "number")
    .sort((a, b) => TIER_ORDER.indexOf(a.quality as string) - TIER_ORDER.indexOf(b.quality as string));
  const cheapestVariant = tiers.slice().sort((a, b) => a.price - b.price)[0];

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-[0_10px_30px_-14px_rgba(91,33,182,0.25)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-14px_rgba(91,33,182,0.35)] ${className}`}
    >
      {product.is_featured ? (
        <span className="absolute right-2.5 top-2.5 z-10 whitespace-nowrap rounded-full bg-saffron px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Bestseller
        </span>
      ) : null}

      <div className="relative aspect-square w-full overflow-hidden bg-surface-tint">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">💎</div>
        )}
        {product.emi_available ? (
          <span className="absolute bottom-2.5 left-2.5 z-10 whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            EMI Available
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.categories?.name ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {product.categories.name}
          </span>
        ) : null}

        <h3 className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">{product.title}</h3>

        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <span className="text-gold">★</span>
          {product.rating} ({product.review_count})
        </span>

        {tiers.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tiers.map((tier) => (
              <div key={tier.id} className="rounded-md border border-surface-border bg-background px-1.5 py-0.5">
                <span className="block text-[8px] font-bold uppercase tracking-wide text-ink-muted">
                  {TIER_LABELS[tier.quality as string] ?? tier.quality}
                </span>
                <span className="block text-[10.5px] font-bold text-gold">{formatPrice(tier.price)}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs font-semibold text-gold sm:text-sm">Price on request</span>
        )}

        {cheapestVariant ? (
          <AddToCartButton
            compact
            item={{
              id: cheapestVariant.id,
              productId: product.id,
              variantId: cheapestVariant.id,
              title: product.title,
              subtitle: product.subtitle,
              price: cheapestVariant.price,
              imageUrl: product.images?.[0],
              category: inferCartCategory(product.categories?.name)
            }}
          />
        ) : null}
      </div>
    </Link>
  );
}
