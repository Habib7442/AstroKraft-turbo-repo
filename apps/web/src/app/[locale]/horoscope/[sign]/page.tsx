import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";
import { constructMetadata, faqSchema, toJsonLdString } from "@/lib/seo";
import { SIGNS, type SignId } from "@/lib/astro/core";
import { getDailyHoroscope, istDateKey, NAKSHATRA_THEMES } from "@/lib/astro/horoscope";
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

  if (!sign) {
    return constructMetadata({ title: "Not Found", path: `/horoscope/${slug}`, locale: loc, noIndex: true });
  }

  const h = getDailyHoroscope(sign.id);
  const dateLabel = new Date(h.date + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });

  return constructMetadata({
    title: `${sign.name} Horoscope Today (${dateLabel})`,
    description: `${sign.name} horoscope for ${dateLabel} — love, career and health predictions, lucky colour and number, updated daily.`,
    path: `/horoscope/${sign.id}`,
    locale: loc,
    keywords: [`${sign.name.toLowerCase()} horoscope today`, `${sign.name.toLowerCase()} horoscope`, "daily horoscope"]
  });
}

function Stars({ score }: { score: number }) {
  return (
    <span className="text-gold" aria-label={`${score} out of 5`}>
      {"★".repeat(score)}
      <span className="text-surface-border">{"★".repeat(5 - score)}</span>
    </span>
  );
}

export default async function HoroscopeSignPage({
  params
}: {
  params: Promise<{ locale: string; sign: string }>;
}) {
  const { locale, sign: slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const sign = findSign(slug);
  if (!sign) notFound();

  const h = getDailyHoroscope(sign.id);
  const gemstoneMap = await loadGemstoneProductMap();
  const gemInfo = GEMSTONES[sign.ruler as keyof typeof GEMSTONES];
  const gemProduct = gemInfo ? gemstoneMap.get(gemInfo.planet) : undefined;

  const idx = SIGNS.findIndex((s) => s.id === sign.id);
  const prevSign = SIGNS[(idx + 11) % 12];
  const nextSign = SIGNS[(idx + 1) % 12];

  const dateLabel = new Date(h.date + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

  const faqs = [
    { question: `What does ${sign.name}'s horoscope say for today?`, answer: h.general },
    {
      question: `What is ${sign.name}'s lucky gemstone?`,
      answer: `${sign.name} is ruled by ${sign.ruler}. The traditional gemstone for ${sign.ruler} is ${gemInfo?.name} (${gemInfo?.sanskritName}), said to ${gemInfo?.reason}.`
    },
    {
      question: `What is today's Moon sign and nakshatra?`,
      answer: `Today the Moon is transiting ${h.moonSignName}, in ${h.nakshatra} nakshatra, on ${h.tithi}.`
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdString(faqSchema(faqs)) }}
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-10 text-center sm:py-14">
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/${locale}/horoscope/${prevSign.id}`}
            aria-label={`${prevSign.name} horoscope`}
            className="text-ink-muted transition-colors hover:text-primary"
          >
            ←
          </Link>
          <span className="text-4xl">{sign.symbol}</span>
          <Link
            href={`/${locale}/horoscope/${nextSign.id}`}
            aria-label={`${nextSign.name} horoscope`}
            className="text-ink-muted transition-colors hover:text-primary"
          >
            →
          </Link>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">{sign.name} Horoscope Today</h1>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-muted">{dateLabel}</p>
        <p className="mt-3 text-sm text-ink-body">{h.opener}</p>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 pb-14">
        <div className="grid grid-cols-4 gap-3 rounded-2xl border border-surface-border bg-surface-card p-4 text-center">
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Overall</p>
            <Stars score={h.scores.overall} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Love</p>
            <Stars score={h.scores.love} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Career</p>
            <Stars score={h.scores.career} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Health</p>
            <Stars score={h.scores.health} />
          </div>
        </div>

        {(
          [
            ["General", h.general],
            ["Love", h.love],
            ["Career", h.career],
            ["Health", h.health]
          ] as const
        ).map(([label, text]) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-surface-card p-5">
            <h2 className="font-serif text-base font-bold text-foreground">{label}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-body">{text}</p>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-surface-border bg-surface-card p-5 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Lucky Colour</p>
            <p className="font-semibold text-foreground">{h.luckyColour}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Lucky Number</p>
            <p className="font-semibold text-foreground">{h.luckyNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Moon Sign Today</p>
            <p className="font-semibold text-foreground">{h.moonSignName}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-ink-muted">Nakshatra</p>
            <p className="font-semibold text-foreground">{h.nakshatra}</p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted">
          The Moon is in {h.moonSignName} ({h.nakshatra}) today — bringing themes of {NAKSHATRA_THEMES[h.nakshatra]}.
        </p>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-sm text-ink-body">
            {sign.name} is ruled by <strong>{sign.ruler}</strong>. Wearing {gemInfo?.name} ({gemInfo?.sanskritName}) is
            traditionally said to {gemInfo?.reason}.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            {gemProduct ? (
              <Link
                href={`/${locale}/products/${gemProduct.slug}`}
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold/90"
              >
                Shop {gemInfo?.name} →
              </Link>
            ) : null}
            <Link
              href={`/${locale}/consultation`}
              className="rounded-full border border-primary px-6 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Talk to an Astrologer
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {faqs.map((f) => (
            <details key={f.question} className="rounded-lg border border-surface-border bg-surface-card p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.question}</summary>
              <p className="mt-2 text-sm text-ink-body">{f.answer}</p>
            </details>
          ))}
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <Link href={`/${locale}/horoscope/${prevSign.id}`} className="font-semibold text-primary hover:underline">
            ← {prevSign.name}
          </Link>
          <Link href={`/${locale}/horoscope`} className="font-semibold text-ink-body hover:underline">
            All Signs
          </Link>
          <Link href={`/${locale}/horoscope/${nextSign.id}`} className="font-semibold text-primary hover:underline">
            {nextSign.name} →
          </Link>
        </div>
      </div>
    </main>
  );
}
