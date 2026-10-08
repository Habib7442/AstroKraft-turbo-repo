import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "About Us",
    description:
      "AstroKraft is a small team in Silchar, Assam, selling lab-certified gemstones, Rudraksha and Vastu products, with Vedic astrology consultations from ₹499.",
    path: "/about",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

// Every claim on this page must be checkable against the live catalogue and
// database (astrologer count, languages, consultation prices). Update the
// copy when those change rather than rounding up.
const offerings = [
  {
    icon: "💎",
    color: "#F1ECFA",
    title: "Vedic Gemstones",
    description: "Natural gemstones for each of the nine planets, each sent with its lab certificate.",
    href: "vedic-gemstones"
  },
  {
    icon: "📿",
    color: "#FCEFE3",
    title: "Rudraksha & Bracelets",
    description: "Rudraksha beads and crystal bracelets, checked by our team before they are packed.",
    href: "rudraksha"
  },
  {
    icon: "🔮",
    color: "#E9F4EF",
    title: "Astrology Consultations",
    description: "Pick a topic, pay a fixed ₹499 or ₹999, and we match you with the right astrologer.",
    href: "consultation"
  },
  {
    icon: "🏠",
    color: "#E6EEF9",
    title: "Vastu Guidance",
    description: "Vastu consultations for your current home, planning for a new build, and home care products.",
    href: "vastu-consultation"
  },
  {
    icon: "🪔",
    color: "#FCE9E3",
    title: "Purohit Booking",
    description: "Tell us the puja, date and language. We call you back to confirm the priest and the price.",
    href: "purohit-booking"
  },
  {
    icon: "✨",
    color: "#FFF6DD",
    title: "Free Vedic Tools",
    description: "Your Kundli, daily horoscope and a gemstone suggestion, free and without signing up.",
    href: "free-kundli"
  }
];

const commitments = [
  "Every gemstone ships with its lab certificate, so you can confirm the stone and its weight yourself.",
  "Consultation fees are fixed and shown before you book. You pay once, at booking.",
  "Pay by card, UPI, netbanking or EMI through Razorpay. We never see or store your card details.",
  "You can download or delete your personal data at any time from the Your Data & Privacy page.",
  "When you write to us, a person on our team in Silchar reads it and replies."
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#F7F5FC]">
      {/* Same cosmic gradient + overlay + scrim treatment as the homepage
          hero, so this page reads as part of the same site rather than a
          bolted-on plain document. */}
      <div
        className="relative flex w-full flex-col items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }}
      >
        <Image src="/hero-section-overlay.png" alt="" fill priority className="object-cover opacity-50" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(rgba(42,30,92,0.55), rgba(20,15,40,0.65))" }}
        />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">About AstroKraft</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Gemstones You Can Verify, Astrologers You Can Talk To
          </h1>
          <p className="mt-4 text-sm text-[#EAEAF2]/85 sm:text-base">
            We are a small team in Rangirkhari, Silchar, selling lab-certified gemstones, Rudraksha and Vastu
            products, and booking consultations with Vedic astrologers who speak Hindi, English and Bengali.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            Why We Started
          </h2>
          <p className="text-sm leading-relaxed text-ink-body sm:text-base">
            Buying a gemstone online usually means trusting a photo and a seller&rsquo;s word. Booking an
            astrologer often means scrolling through hundreds of profiles you know nothing about, with the meter
            running. We started AstroKraft so you can check what you are paying for before you pay for it.
          </p>
          <p className="text-sm leading-relaxed text-ink-body sm:text-base">
            So every gemstone we sell comes with its lab certificate. And instead of a crowded directory, we work
            with a small group of five astrologers. You choose what you want guidance on (career, marriage, health,
            money, studies or your Kundli), pay one fixed fee, and we match you with the astrologer best suited to
            that question.
          </p>
          <p className="text-sm leading-relaxed text-ink-body sm:text-base">
            Not ready to buy anything? Start with our free tools. Generate your Kundli, read your daily horoscope, or
            find out which gemstone your birth chart points to, all without creating an account.
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="w-full bg-[#F7F5FC]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            What We Offer
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((item) => (
              <Link
                key={item.title}
                href={`/${locale}/${item.href}`}
                className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </div>
                <h3 className="font-serif text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-ink-body">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            What You Can Count On
          </h2>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-ink-body sm:text-base">
            {commitments.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 text-gold" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full" style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 py-14 text-center sm:py-16">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">Not Sure Which Stone Suits You?</h2>
          <p className="max-w-lg text-sm text-[#EAEAF2]/85 sm:text-base">
            Enter your birth details in the free Gemstone Finder, or talk it through with an astrologer from ₹499.
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/gemstone-recommendation`}
              className="rounded-full bg-[#12805F] px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1BAF82] sm:text-base"
            >
              Find My Gemstone
            </Link>
            <Link
              href={`/${locale}/consultation`}
              className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 sm:text-base"
            >
              Book a Consultation
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/60">
            Have a question first? Reach out on our{" "}
            <Link href={`/${locale}/contact`} className="underline underline-offset-2 hover:text-white">
              Contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
