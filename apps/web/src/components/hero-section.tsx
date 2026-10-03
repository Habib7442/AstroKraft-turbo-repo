import Link from "next/link";
import { FREE_TOOLS } from "@/lib/free-tools";

interface HeroSectionProps {
  locale: string;
}

// Plain server-rendered markup (no "use client", no state) so the h1,
// sub-line, and CTA links are present in the initial HTML for crawlers and
// link-preview bots — not something that only appears after client JS runs.
// The cosmic overlay + scrim behind this (and behind CategoryStories below
// it) live on the shared parent wrapper in page.tsx, not here — both
// sections need to sit on the same continuous background.
export function HeroSection({ locale }: HeroSectionProps) {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 pt-8 pb-6 sm:pt-14 sm:pb-10 text-center">
      {/* "— Online" is hidden below sm: on a narrow screen it was wrapping
          onto its own dangling line as the 3rd line of the headline; it's
          implied anyway, so mobile just shows the shorter phrase while
          tablet/desktop (with more width per line) keeps the full one. */}
      <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
        Certified Gemstones &amp; Vedic Guidance<span className="hidden sm:inline"> — Online</span>
      </h1>

      {/* Replaces the old gold "For Every Planet..." line. Dimmer than the
          headline (soft lavender-white rather than the near-white used
          right below it) so the eye lands on the <h1> first — at the same
          near-white the two were competing for equal visual weight. */}
      <p className="mt-2 text-sm sm:text-base font-semibold text-[#D8D4EC]">
        Lab-certified gemstones you can trust, guided by real astrologers.
      </p>

      <p className="mt-3 text-sm sm:text-lg text-[#EAEAF2]/85 max-w-2xl mx-auto">
        Shop 100% natural, lab-certified gemstones, or consult a verified Vedic astrologer.
      </p>

      {/* Two equal-weight primary buttons — neither gemstones nor
          consultations is the site's "main" action, so both use the same
          solid style, size, and padding; only the color differs. Emerald
          replaces the old gold "Shop Gemstones" button, which read muddy
          against this dark gradient. */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/${locale}/vedic-gemstones`}
          className="w-full sm:w-auto rounded-full bg-[#12805F] px-8 py-3 text-sm sm:text-base font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1BAF82]"
        >
          Shop Gemstones
        </Link>
        <Link
          href={`/${locale}/consultation`}
          className="w-full sm:w-auto rounded-full bg-primary px-8 py-3 text-sm sm:text-base font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Talk to an Astrologer
        </Link>
      </div>

      {/* The free tools are the site's top-of-funnel entry point, but on
          mobile the header's Free Tools menu sits off-screen in the
          horizontally scrolling nav row - surfaced here so nobody has to
          hunt for them. Three columns fit a 360px phone at this size. */}
      <div className="mx-auto mt-6 max-w-xl">
        {/* "Hot" offer badge: saffron is the brand's offer/new-tag colour, but
            white on raw saffron is too low-contrast, so the fill is a deeper
            orange (#C2410C, 5:1 with white) with a saffron glow. */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C2410C] px-3 py-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_0_14px_rgba(232,151,58,0.55)] ring-1 ring-saffron/60">
          🔥 Free Vedic Tools
        </span>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {FREE_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={`/${locale}/${tool.href}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-[11px] sm:text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-saffron/70 hover:bg-white/20 hover:text-white sm:flex-row sm:justify-center sm:gap-2 sm:py-3"
            >
              <span aria-hidden className="text-lg sm:text-base">
                {tool.icon}
              </span>
              {tool.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
