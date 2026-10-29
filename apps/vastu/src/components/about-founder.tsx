import { BadgeCheck } from "lucide-react";
import { BookNowButton } from "@/components/booking";
import { BRAND, FOUNDER, FOUNDER_PHOTO } from "@/lib/site";

// "Meet your consultant" section, shared by the Flat (/) and Business
// (/business-vastu) pages. Must render inside a BookingProvider.
export function AboutFounder() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section grid items-center gap-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="mx-auto w-full max-w-xs">
          {FOUNDER_PHOTO ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FOUNDER_PHOTO}
              alt={FOUNDER}
              width={720}
              height={960}
              fetchPriority="high"
              className="aspect-[3/4] w-full rounded-2xl border border-gold/40 object-cover object-top"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-gold/40 bg-gradient-to-b from-night-700 to-night-900">
              <span className="gold-text font-display text-7xl font-bold">BB</span>
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">Meet your consultant</p>
          <h2 className="section-title">{FOUNDER}</h2>
          <p className="mt-2 font-semibold text-gold-soft">Founder, {BRAND} &amp; AstroKraft · Business &amp; Vastu Consultant</p>
          <p className="mt-4 text-cream">
            Biprangshu brings a business lens to Vastu. He looks at your space the way you look at your business — sales,
            customers, cash flow, team and growth — and connects Vastu principles to practical decisions you can actually act on.
          </p>
          <p className="mt-3 text-cream">
            As the founder of AstroKraft, a Vedic astrology and certified-gemstone brand, he helps people apply traditional Indian wisdom to
            real-life decisions. {BRAND} brings that same approach to business owners and their workplaces.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {["Founder of AstroKraft", "Every session 1:1 with Biprangshu", "Online across India"].map((t) => (
              <li key={t} className="flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-gold-soft">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <BookNowButton className="btn-gold mt-6">Book with Biprangshu</BookNowButton>
        </div>
      </div>
    </section>
  );
}
