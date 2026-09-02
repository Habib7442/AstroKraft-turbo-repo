import Image from "next/image";
import Link from "next/link";
import type { Astrologer } from "@astrokraft/db";

export interface AstrologerCardData extends Astrologer {
  astrologer_categories: { category_id: string }[];
}

interface AstrologerCardProps {
  astrologer: AstrologerCardData;
  categoryNameById?: Map<string, string>;
  selected?: boolean;
  className?: string;
  bookHref?: string;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function AstrologerCard({ astrologer, categoryNameById, selected, className = "", bookHref }: AstrologerCardProps) {
  const categories = astrologer.astrologer_categories.slice(0, 3);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-surface-card transition-colors ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-surface-border"
      } ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-tint">
        {astrologer.photo_url ? (
          <Image src={astrologer.photo_url} alt={astrologer.name} fill sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🔮</div>
        )}
        {astrologer.experience_years != null ? (
          <span className="absolute left-2.5 top-2.5 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
            {astrologer.experience_years}+ yrs exp.
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground sm:text-base">{astrologer.name}</h3>

        <span className="flex items-center gap-1 text-xs text-ink-muted">
          <span className="text-gold">★</span> {astrologer.rating} ({astrologer.review_count})
        </span>

        {astrologer.bio ? <p className="line-clamp-2 text-xs text-ink-body">{astrologer.bio}</p> : null}

        {astrologer.languages?.length > 0 ? (
          <p className="line-clamp-1 text-[11px] text-ink-muted">Speaks: {astrologer.languages.join(", ")}</p>
        ) : null}

        {categoryNameById && categories.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {categories.map((c) => (
              <span
                key={c.category_id}
                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                {categoryNameById.get(c.category_id) ?? "…"}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-surface-border pt-2.5">
          <span className="text-sm font-bold text-gold">{astrologer.price ? formatPrice(astrologer.price) : "—"}</span>
          {selected !== undefined ? (
            <span className={`text-[11px] font-semibold ${selected ? "text-primary" : "text-ink-muted"}`}>
              {selected ? "Selected ✓" : "Tap to select"}
            </span>
          ) : null}
        </div>

        {bookHref ? (
          <Link
            href={bookHref}
            className="mt-2 block rounded-full bg-gold py-2 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-gold/90"
          >
            Book Now
          </Link>
        ) : null}
      </div>
    </div>
  );
}
