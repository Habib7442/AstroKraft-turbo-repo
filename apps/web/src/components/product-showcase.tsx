import Link from "next/link";
import { GemstoneCard, type ProductWithRelations } from "@/components/gemstone-card";

interface ProductShowcaseProps {
  title: string;
  subtitle?: string | null;
  products: ProductWithRelations[];
  locale: string;
  bgClassName?: string;
  exploreHref?: string;
  exploreLabel?: string;
}

export function ProductShowcase({
  title,
  subtitle,
  products,
  locale,
  bgClassName = "bg-background",
  exploreHref,
  exploreLabel = "Explore All →"
}: ProductShowcaseProps) {
  if (products.length === 0) return null;

  return (
    <section className={`w-full ${bgClassName}`}>
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-2 max-w-xl text-sm text-ink-body sm:text-base">{subtitle}</p> : null}
          </div>
          {exploreHref ? (
            <Link
              href={exploreHref}
              className="whitespace-nowrap rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {exploreLabel}
            </Link>
          ) : null}
        </div>

        <div className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:gap-6">
          {products.map((product) => (
            <GemstoneCard
              key={product.id}
              product={product}
              locale={locale}
              className="w-[220px] shrink-0 snap-start sm:w-[260px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
