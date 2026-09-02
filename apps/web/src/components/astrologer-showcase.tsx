import Link from "next/link";
import { AstrologerCard, type AstrologerCardData } from "@/components/astrologer-card";

interface AstrologerShowcaseProps {
  astrologers: AstrologerCardData[];
  categoryNameById: Map<string, string>;
  locale: string;
  bgClassName?: string;
}

export function AstrologerShowcase({ astrologers, categoryNameById, locale, bgClassName = "bg-background" }: AstrologerShowcaseProps) {
  if (astrologers.length === 0) return null;

  return (
    <section className={`w-full ${bgClassName}`}>
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">Talk to Our Astrologers</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-body sm:text-base">
              Book a personal consultation with a verified expert for career, love, finance, health, and more.
            </p>
          </div>
          <Link
            href={`/${locale}/consultation`}
            className="whitespace-nowrap rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Book a Consultation →
          </Link>
        </div>

        <div className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:gap-6">
          {astrologers.map((astrologer) => (
            <div key={astrologer.id} className="w-[240px] shrink-0 snap-start sm:w-[260px]">
              <AstrologerCard
                astrologer={astrologer}
                categoryNameById={categoryNameById}
                bookHref={`/${locale}/consultation?astrologer=${astrologer.id}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
