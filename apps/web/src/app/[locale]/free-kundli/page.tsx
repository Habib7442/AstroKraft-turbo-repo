import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata, faqSchema, webApplicationSchema, toJsonLdString } from "@/lib/seo";
import { KundliForm } from "@/components/astro/kundli-form";
import { loadGemstoneProductMap } from "@/lib/astro/gemstone-product";

const FAQS = [
  {
    question: "Is this kundli generator really free?",
    answer: "Yes. Enter your date, time and place of birth to get your birth chart, planet positions and Vimshottari dasha timeline at no cost."
  },
  {
    question: "How accurate is the chart?",
    answer: "Planetary positions are computed astronomically for the exact moment and place you enter, using the Lahiri (Chitrapaksha) ayanamsa - the standard used across Vedic astrology in India."
  },
  {
    question: "Do I need to know my exact birth time?",
    answer: "For an accurate ascendant (lagna) and house placements, yes - even a few minutes' difference can shift the ascendant. If you're unsure, check your birth certificate or hospital record."
  },
  {
    question: "What is Vimshottari Dasha?",
    answer: "It's the most widely used timing system in Vedic astrology, dividing life into planetary periods (mahadashas) based on your Moon's position at birth, used to understand which themes are active in different life phases."
  }
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Free Kundli & Birth Chart Generator",
    description:
      "Generate your free Janam Kundli online — Vedic birth chart, planet positions, nakshatra and Vimshottari dasha, calculated instantly from your date, time and place of birth.",
    path: "/free-kundli",
    locale: isValidLocale(locale) ? locale : "en",
    keywords: ["free kundli", "janam kundli online", "free birth chart", "kundli by date of birth"]
  });
}

export default async function FreeKundliPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const gemstoneMap = Object.fromEntries(await loadGemstoneProductMap());

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdString([
            webApplicationSchema({
              name: "AstroKraft Free Kundli Generator",
              description: "Free Vedic birth chart (Janam Kundli) generator with planet positions and dasha timeline.",
              path: "/free-kundli"
            }),
            faqSchema(FAQS)
          ])
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-6 py-12 text-center sm:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Free Kundli / Birth Chart Generator</h1>
        <p className="mt-3 text-sm text-ink-body sm:text-base">
          Enter your birth details for your free Vedic birth chart — planet positions, nakshatra, and your current
          Vimshottari dasha, calculated instantly.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-12">
        <KundliForm locale={locale} gemstoneMap={gemstoneMap} />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:py-16">
        <div>
          <h2 className="font-serif italic text-xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4">
            What Is a Kundli?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            A kundli (Janam Kundli, or birth chart) is a map of where the Sun, Moon and planets sat in the sky at the
            exact moment and place you were born. In Vedic astrology, this chart is read house by house — career,
            relationships, health, wealth — to understand your natural tendencies and the timing of life events
            through the dasha system.
          </p>
        </div>
        <div>
          <h2 className="font-serif italic text-xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4">
            How to Read Your Birth Chart
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            Your <strong>Lagna (Ascendant)</strong> is the sign rising on the eastern horizon at your birth moment —
            it sets house 1 and everything else is read relative to it. Your <strong>Moon sign (Rashi)</strong> and{" "}
            <strong>Nakshatra</strong> (birth star) govern your Vimshottari dasha timeline. Each planet's house
            placement shows which area of life it most strongly influences.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {FAQS.map((f) => (
            <details key={f.question} className="rounded-lg border border-surface-border bg-surface-card p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.question}</summary>
              <p className="mt-2 text-sm text-ink-body">{f.answer}</p>
            </details>
          ))}
        </div>
        <p className="text-center text-sm text-ink-body">
          Want a reading tailored to your chart?{" "}
          <Link href={`/${locale}/consultation`} className="font-semibold text-primary hover:underline">
            Book a consultation
          </Link>{" "}
          with a verified Vedic astrologer.
        </p>
      </div>
    </main>
  );
}
