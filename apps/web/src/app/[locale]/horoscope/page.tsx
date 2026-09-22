import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { LOCALES } from "@/lib/locales";
import { SIGNS } from "@/lib/astro/core";
import { istDateKey } from "@/lib/astro/horoscope";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Daily Horoscope — All 12 Zodiac Signs",
    description: "Today's horoscope for all 12 zodiac signs — love, career and health, updated daily.",
    path: "/horoscope",
    locale: isValidLocale(locale) ? locale : "en",
    keywords: ["daily horoscope", "aaj ka rashifal", "horoscope today"]
  });
}

export default async function HoroscopeIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const today = new Date();
  const dateLabel = new Date(istDateKey(today) + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 text-center sm:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Daily Horoscope</h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Today — {dateLabel}</p>
        <p className="mt-3 text-sm text-ink-body sm:text-base">
          Pick your zodiac sign for today&rsquo;s reading on love, career and health.
        </p>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SIGNS.map((sign) => (
            <Link
              key={sign.id}
              href={`/${locale}/horoscope/${sign.id}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-surface-card p-5 text-center shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{sign.symbol}</span>
              <span className="font-serif text-base font-bold text-foreground">{sign.name}</span>
              <span className="text-xs text-ink-muted">{sign.sanskrit}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
