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
    description: "AstroKraft is a Vedic astrology and lab-certified gemstone marketplace based in Silchar, Assam.",
    path: "/about",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

const offerings = [
  {
    icon: "💎",
    color: "#F1ECFA",
    title: "Vedic Gemstones",
    description: "100% natural, lab-certified gemstones matched to the right planet for you.",
    href: "vedic-gemstones"
  },
  {
    icon: "📿",
    color: "#FCEFE3",
    title: "Rudraksha & Bracelets",
    description: "Authentic Rudraksha beads and crystal bracelets, sourced and verified.",
    href: "rudraksha"
  },
  {
    icon: "🔮",
    color: "#E9F4EF",
    title: "Astrology Consultations",
    description: "One-on-one guidance from verified astrologers on career, love, health, and more.",
    href: "consultation"
  },
  {
    icon: "🪔",
    color: "#FCE9E3",
    title: "Vastu & Purohit Services",
    description: "Vastu consultations for your home, plus priest booking for pujas and rituals.",
    href: "purohit-booking"
  }
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Our Story</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Vedic Guidance and Certified Gemstones, Under One Roof
          </h1>
          <p className="mt-4 text-sm text-[#EAEAF2]/85 sm:text-base">
            AstroKraft was built in Rangirkhari, Silchar, Assam, to bring authentic Vedic astrology and
            lab-certified gemstones to customers across India — without the guesswork.
          </p>
          <p className="mt-5 text-[11px] font-medium text-white/70 sm:text-xs">
            Lab Certified <span className="mx-1.5 text-white/30">·</span> Authentic &amp; Trusted{" "}
            <span className="mx-1.5 text-white/30">·</span> Expert Guidance{" "}
            <span className="mx-1.5 text-white/30">·</span> Safe &amp; Fast Delivery
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            Why AstroKraft
          </h2>
          <p className="text-sm leading-relaxed text-ink-body sm:text-base">
            Gemstones and astrology have always run on trust — trust that a stone is what it&rsquo;s claimed to be,
            and trust that the person guiding you actually knows their craft. Too often, that trust is hard to
            verify online. AstroKraft exists to close that gap: every gemstone we sell is lab-certified before it
            reaches you, and every astrologer on our platform is vetted for genuine expertise, not just a listed
            profile.
          </p>
          <p className="text-sm leading-relaxed text-ink-body sm:text-base">
            We&rsquo;re rooted in Vedic tradition and built for how people actually shop and seek guidance today —
            browse and buy gemstones, Rudraksha, and Vastu products online, or book a consultation with one of our
            100+ verified Vedic astrologers, all from the same trusted platform.
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="w-full bg-[#F7F5FC]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            What We Offer
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Promise */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-16 sm:py-20">
          <h2 className="font-serif italic text-2xl font-bold text-foreground underline decoration-gold decoration-2 underline-offset-4 sm:text-3xl">
            Our Promise
          </h2>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-ink-body sm:text-base">
            <li className="flex gap-3">
              <span className="mt-0.5 text-gold">✓</span>
              Every gemstone, Rudraksha, and bracelet is verified for authenticity before it ships.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-gold">✓</span>
              Every astrologer is vetted for genuine expertise, not just a listed profile.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-gold">✓</span>
              Secure checkout via Razorpay — we never store your card, UPI, or netbanking details.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-gold">✓</span>
              Real support from a real team in Silchar, Assam — not a chatbot maze.
            </li>
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full" style={{ background: "linear-gradient(135deg, #0B1026 0%, #2A1A5E 50%, #4C1D95 100%)" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 py-14 text-center sm:py-16">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">Ready to begin?</h2>
          <p className="max-w-lg text-sm text-[#EAEAF2]/85 sm:text-base">
            Shop certified gemstones, or talk to a verified astrologer today.
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/vedic-gemstones`}
              className="rounded-full bg-[#12805F] px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1BAF82] sm:text-base"
            >
              Shop Gemstones
            </Link>
            <Link
              href={`/${locale}/consultation`}
              className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 sm:text-base"
            >
              Talk to an Astrologer
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
