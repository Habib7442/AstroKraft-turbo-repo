import Image from "next/image";
import Link from "next/link";
import type { Product } from "@astrokraft/db";
import { GemstoneTierSelector } from "@/components/gemstone-tier-selector";

export interface ProductVariantRow {
  id: string;
  quality: string | null;
  price: number;
  original_price?: number | null;
}

export interface ProductWithRelations extends Product {
  categories: { name: string } | null;
  product_variants: ProductVariantRow[];
}

const TIER_ORDER = ["basic", "semi_prem", "premium"];

interface GemstoneCardProps {
  product: ProductWithRelations;
  locale: string;
  className?: string;
}

export function GemstoneCard({ product, locale, className = "" }: GemstoneCardProps) {
  const tiers = product.product_variants
    .filter((v) => v.quality && typeof v.price === "number")
    .sort((a, b) => TIER_ORDER.indexOf(a.quality as string) - TIER_ORDER.indexOf(b.quality as string));
  const isHot = product.badge === "HOT";

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-lg bg-surface-card shadow-[0_10px_30px_-14px_rgba(91,33,182,0.25)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-14px_rgba(91,33,182,0.35)] ${
        isHot ? "border-2 border-saffron" : "border border-surface-border"
      } ${className}`}
    >
      {isHot ? (
        <span className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 whitespace-nowrap rounded-full bg-saffron px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm">
          🔥 Hot Pick
        </span>
      ) : product.is_featured ? (
        <span className="absolute right-2.5 top-2.5 z-10 whitespace-nowrap rounded-full bg-saffron px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm">
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

        {product.review_count > 0 ? (
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <span className="text-gold">★</span>
            {product.rating} ({product.review_count})
          </span>
        ) : null}

        {tiers.length > 0 ? (
          <GemstoneTierSelector product={product} tiers={tiers} categoryName={product.categories?.name} />
        ) : (
          <span className="text-xs font-semibold text-gold sm:text-sm">Price on request</span>
        )}
      </div>
    </Link>
  );
}
