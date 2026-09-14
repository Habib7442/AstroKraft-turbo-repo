import Link from "next/link";
import type { PlatformReview } from "@astrokraft/db";

interface TestimonialsShowcaseProps {
  reviews: Pick<PlatformReview, "id" | "name" | "rating" | "comment">[];
  locale: string;
  bgClassName?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-white/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function TestimonialCard({ review }: { review: Pick<PlatformReview, "id" | "name" | "rating" | "comment"> }) {
  return (
    <div
      className="flex w-[260px] shrink-0 flex-col rounded-xl p-5 shadow-lg sm:w-[300px]"
      style={{ background: "linear-gradient(135deg, #1B1030 0%, #2A1A5E 100%)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-white">{review.name}</p>
          <Stars rating={review.rating} />
        </div>
      </div>
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/80">{review.comment}</p>
    </div>
  );
}

// The homepage's own trust-building section — a preview of what's on the
// full, public /testimonials page (submissions only happen there; this is
// display-only, no form here). Cards auto-scroll in a continuous marquee
// (the track is this same list rendered twice back-to-back, animated
// exactly one copy's width via animate-marquee, so the loop point is
// seamless) rather than requiring a manual horizontal drag - pauses on
// hover/focus so a visitor can actually read one without it sliding away
// mid-sentence.
export function TestimonialsShowcase({ reviews, locale, bgClassName = "bg-background" }: TestimonialsShowcaseProps) {
  if (reviews.length === 0) return null;

  return (
    <section className={`w-full ${bgClassName}`}>
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
              What Our Customers Say
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-body sm:text-base">
              Real feedback from real customers — and yours is welcome too, no account needed.
            </p>
          </div>
          <Link
            href={`/${locale}/testimonials`}
            className="whitespace-nowrap rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Write a Review →
          </Link>
        </div>

        <div
          tabIndex={0}
          aria-label="Testimonials carousel. Focus to pause animation."
          className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
        >
          <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none sm:gap-6">
            {[...reviews, ...reviews].map((r, i) => (
              <TestimonialCard key={`${r.id}-${i}`} review={r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
