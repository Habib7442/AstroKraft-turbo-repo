import Link from "next/link";
import type { ConsultationCategory } from "@astrokraft/db";

interface ConsultationCategoryShowcaseProps {
  categories: ConsultationCategory[];
  locale: string;
}

// The homepage entry point for the consultation "door" — mirrors the same
// category cards ConsultationBookingFlow renders on /consultation itself
// (same colors, icon circle, label style), but as plain links instead of an
// inline selector: picking one here takes you straight to the booking form
// for that category instead of re-selecting it on the next page. Which
// specific astrologer handles the session is an admin call made afterward,
// not something the customer picks.
export function ConsultationCategoryShowcase({ categories, locale }: ConsultationCategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10 sm:py-14">
      <div className="mb-6 text-left sm:mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Book a Consultation</h2>
        <p className="mt-2 text-sm text-ink-body sm:text-base">
          Get personalized guidance from our verified Vedic astrologers.
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">
          Connected with 100+ verified Vedic astrologers
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/${locale}/consultation?category=${category.id}`}
            style={{ backgroundColor: category.color ?? "#F1ECFA" }}
            className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">
              {category.icon || "✨"}
            </div>
            <span className="text-xs font-bold uppercase text-foreground">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
