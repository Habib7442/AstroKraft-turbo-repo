import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata, faqSchema, webApplicationSchema, toJsonLdString } from "@/lib/seo";
import { SIGNS } from "@/lib/astro/core";
import { GemstoneRecommendationForm } from "@/components/astro/gemstone-recommendation-form";
import { loadGemstoneProductMap } from "@/lib/astro/gemstone-product";

const FAQS = [
  {
    question: "Which gemstone should I wear?",
    answer: "Pick your sun sign below for an instant, general recommendation, or use the full tool with your exact birth time and place for a chart-based primary and secondary gemstone."
  },
  {
    question: "Can I wear more than one gemstone?",
    answer: "Yes, but avoid combining stones for planets that are traditionally considered enemies (e.g. Ruby and Blue Sapphire) unless an astrologer confirms it's safe for your chart."
  },
  {
    question: "Is Blue Sapphire safe for everyone?",
    answer: "No — Blue Sapphire (Neelam) acts faster and more strongly than most gemstones. Always trial it for a few days, or get a consultation first, before committing to it permanently."
  }
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Gemstone Recommendation — Which Gemstone Should You Wear?",
    description: "Find out which gemstone suits you — pick your sun sign for an instant answer, or use your birth chart for a personal recommendation.",
    path: "/gemstone-recommendation",
    locale: isValidLocale(locale) ? locale : "en",
    keywords: ["which gemstone should i wear", "gemstone by date of birth", "lucky stone for zodiac sign"]
  });
}

export default async function GemstoneRecommendationPage({ params }: { params: Promise<{ locale: string }> }) {
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
              name: "AstroKraft Gemstone Recommendation Tool",
              description: "Find out which gemstone to wear based on your zodiac sign or full birth chart.",
              path: "/gemstone-recommendation"
            }),
            faqSchema(FAQS)
          ])
        }}
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-12 text-center sm:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Which Gemstone Should You Wear?</h1>
        <p className="mt-3 text-sm text-ink-body sm:text-base">
          Pick your sign for an instant answer, or enter your full birth details for a chart-based recommendation.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6">
        <h2 className="font-serif italic text-lg font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4">
          Quick Pick — By Sun Sign
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {SIGNS.map((sign) => (
            <Link
              key={sign.id}
              href={`/${locale}/gemstone-recommendation/${sign.id}`}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="text-2xl">{sign.symbol}</span>
              <span className="text-xs font-bold text-foreground">{sign.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <h2 className="font-serif italic text-lg font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4">
          Full Recommendation — By Birth Chart
        </h2>
        <p className="mt-2 text-sm text-ink-body">
          More accurate: uses your ascendant and Moon sign, not just your sun sign.
        </p>
        <div className="mt-4">
          <GemstoneRecommendationForm locale={locale} gemstoneMap={gemstoneMap} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-6 pb-16">
        {FAQS.map((f) => (
          <details key={f.question} className="rounded-lg border border-surface-border bg-surface-card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.question}</summary>
            <p className="mt-2 text-sm text-ink-body">{f.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
