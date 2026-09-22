import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { constructMetadata, faqSchema, toJsonLdString } from "@/lib/seo";
import { SIGNS } from "@/lib/astro/core";
import { GEMSTONES } from "@/lib/astro/gemstones";
import { loadGemstoneProductMap } from "@/lib/astro/gemstone-product";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SIGNS.map((s) => ({ locale, sign: s.id })));
}

function findSign(slug: string) {
  return SIGNS.find((s) => s.id === slug);
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; sign: string }>;
}): Promise<Metadata> {
  const { locale, sign: slug } = await params;
  const sign = findSign(slug);
  const loc = isValidLocale(locale) ? locale : "en";
  if (!sign) return constructMetadata({ title: "Not Found", path: `/gemstone-recommendation/${slug}`, locale: loc, noIndex: true });

  const gem = GEMSTONES[sign.ruler as keyof typeof GEMSTONES];
  return constructMetadata({
    title: `Lucky Gemstone for ${sign.name}`,
    description: `The lucky gemstone for ${sign.name} is ${gem.name} (${gem.sanskritName}) — which finger, metal and day to wear it, and why it's recommended.`,
    path: `/gemstone-recommendation/${sign.id}`,
    locale: loc,
    keywords: [`lucky gemstone for ${sign.name.toLowerCase()}`, `${sign.name.toLowerCase()} gemstone`, "which gemstone should i wear"]
  });
}

export default async function GemstoneRecommendationSignPage({
  params
}: {
  params: Promise<{ locale: string; sign: string }>;
}) {
  const { locale, sign: slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const sign = findSign(slug);
  if (!sign) notFound();

  const gem = GEMSTONES[sign.ruler as keyof typeof GEMSTONES];
  const gemstoneMap = await loadGemstoneProductMap();
  const product = gemstoneMap.get(gem.planet);

  const faqs = [
    {
      question: `What is the lucky gemstone for ${sign.name}?`,
      answer: `${sign.name} is ruled by ${sign.ruler}, so its traditional gemstone is ${gem.name} (${gem.sanskritName}).`
    },
    {
      question: `Which finger should ${sign.name} wear ${gem.name} on?`,
      answer: `${gem.name} is traditionally worn on the ${gem.finger} in ${gem.metal}, first put on during ${gem.day}.`
    },
    {
      question: "Should I consult an astrologer before wearing a gemstone?",
      answer:
        "Yes, especially for stronger stones like Blue Sapphire or Hessonite — a consultation confirms the stone actually suits your specific chart, not just your sun sign."
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(faqSchema(faqs)) }} />

      <div className="mx-auto w-full max-w-2xl px-6 py-12 text-center sm:py-16">
        <span className="text-4xl">{sign.symbol}</span>
        <h1 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Lucky Gemstone for {sign.name}
        </h1>
        <p className="mt-3 text-sm text-ink-body sm:text-base">
          {sign.name} ({sign.sanskrit}) is ruled by <strong>{sign.ruler}</strong>, whose traditional gemstone is{" "}
          <strong>
            {gem.name} ({gem.sanskritName})
          </strong>
          .
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 pb-16">
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6">
          <h2 className="font-serif text-lg font-bold text-foreground">
            {gem.name} <span className="text-ink-muted">({gem.sanskritName})</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            Worn to {gem.reason}. Traditionally set in <strong>{gem.metal}</strong> and worn on the{" "}
            <strong>{gem.finger}</strong>, first worn on a <strong>{gem.day}</strong>.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {product ? (
              <Link
                href={`/${locale}/products/${product.slug}`}
                className="flex-1 rounded-full bg-gold px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-gold/90"
              >
                Shop {gem.name} →
              </Link>
            ) : (
              <Link
                href={`/${locale}/vedic-gemstones`}
                className="flex-1 rounded-full bg-gold px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-gold/90"
              >
                Shop Gemstones →
              </Link>
            )}
            <Link
              href={`/${locale}/gemstone-recommendation`}
              className="flex-1 rounded-full border border-primary px-6 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Get My Personal Recommendation
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-ink-muted">
            This is general guidance based on your sun sign. For a personal recommendation based on your full birth
            chart, use the full tool above or{" "}
            <Link href={`/${locale}/consultation`} className="font-semibold text-primary hover:underline">
              book a consultation
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          {faqs.map((f) => (
            <details key={f.question} className="rounded-lg border border-surface-border bg-surface-card p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.question}</summary>
              <p className="mt-2 text-sm text-ink-body">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
