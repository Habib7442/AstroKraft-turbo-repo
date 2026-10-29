import type { Metadata } from "next";
import { Store, TrendingDown, Users, Wallet } from "lucide-react";
import { AboutFounder } from "@/components/about-founder";
import { BookingProvider, BookNowButton } from "@/components/booking";
import { SiteFooter, SiteHeader, StickyCta } from "@/components/site-chrome";
import { VideoStories } from "@/components/video-stories";
import { TESTIMONIALS } from "@/lib/testimonials";
import { BRAND, BUSINESS_WHATSAPP_URL, FOUNDER, OFFERS } from "@/lib/site";

const OFFER = OFFERS.business;

export const metadata: Metadata = {
  title: `Business Vastu Report + Expert Call | ${BRAND}`,
  description: `Is your shop or office blocking your business growth? Get a Vastu review of your business space, a written report and a 30-minute one-to-one call with ${FOUNDER} — ${OFFER.feeLabel}, no heavy construction.`,
  alternates: { canonical: "/business-vastu" },
  openGraph: {
    title: "Is Your Shop or Office Blocking Your Business Growth?",
    description: `Layout check, written Vastu report and a 30-minute expert call — ${OFFER.feeLabel}.`,
    url: "/business-vastu",
    siteName: BRAND,
    type: "website"
  }
};

const HERO_INCLUDES = [
  "Layout check of your shop, clinic, office or factory",
  "Cash counter, entrance and seating position review",
  "Written report of major Vastu defects",
  "30-minute one-to-one call with the expert"
];

const PROBLEMS = [
  { icon: TrendingDown, title: "Sales are flat", text: "Ads and effort, but no growth." },
  { icon: Wallet, title: "Money is stuck", text: "Delayed payments and cash crunch." },
  { icon: Users, title: "Partner or staff trouble", text: "Conflicts and high staff turnover." },
  { icon: Store, title: "Opening something new", text: "New shop, branch or factory, done right from day one." }
];

const STEPS = [
  { title: `Book & pay ${OFFER.feeLabel}`, text: "Pick a call slot and pay securely by UPI or card." },
  { title: "Upload your layout", text: "Send your floor plan or photos of your space on WhatsApp." },
  { title: "Talk to the expert", text: "Get your written report and remedies on a one-to-one call." }
];

export default function BusinessVastu() {
  return (
    <BookingProvider offer="business">
      <SiteHeader whatsappUrl={BUSINESS_WHATSAPP_URL} />
      <main className="pb-24 sm:pb-0">
        <Hero />
        <Problems />
        <AboutFounder />
        <VideoStories />
        <HowItWorks />
        <Testimonials />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta feeLabel={OFFER.feeLabel} whatsappUrl={BUSINESS_WHATSAPP_URL} />
    </BookingProvider>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy">
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="eyebrow !text-gold-bright">Business Vastu consultation</p>
          <h1 className="mt-3 text-[2.5rem] font-extrabold leading-[1.05] text-white sm:text-6xl">
            Is Your Shop or Office <span className="text-gold-bright">Blocking Your Business Growth?</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Get a Vastu review of your business space and a one-to-one call with the expert. Practical fixes, no heavy construction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <BookNowButton className="btn-gold w-full sm:w-auto">Book My Business Vastu Call</BookNowButton>
            <p className="text-center text-sm text-white/70 sm:text-left">
              Only <strong className="text-gold-bright">{OFFER.feeLabel}</strong>. Report and call included.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-gold-bright bg-white p-6 shadow-2xl shadow-black/30">
          <h2 className="text-lg font-bold text-cream">Your {OFFER.feeLabel} consultation</h2>
          <ol className="mt-4 space-y-3">
            {HERO_INCLUDES.map((t, i) => (
              <li key={t} className="flex gap-3 text-sm text-cream">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-xs font-extrabold text-navy">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-gold-line pt-4 text-xs text-muted">Limited call slots every week.</p>
        </div>
      </div>
    </section>
  );
}

function Problems() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <h2 className="section-title text-center">Do these problems sound familiar?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className={`card bg-white ${i === PROBLEMS.length - 1 ? "sm:col-span-3" : ""}`}>
              <Icon className="h-6 w-6 text-gold" aria-hidden />
              <h3 className="mt-3 font-bold text-cream">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section">
      <h2 className="section-title text-center">How it works</h2>
      <ol className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-base font-extrabold text-gold-bright">{i + 1}</span>
            <h3 className="mt-3 font-bold text-cream">{s.title}</h3>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <BookNowButton className="btn-gold w-full sm:w-auto">Book My Business Vastu Call</BookNowButton>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <h2 className="section-title text-center">What business owners say</h2>
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card flex w-[85%] shrink-0 snap-start flex-col bg-white sm:w-auto">
              <span className="font-display text-4xl leading-none text-gold" aria-hidden>
                “
              </span>
              <blockquote className="mt-1 flex-1 text-sm leading-relaxed text-cream">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t border-night-600 pt-4 text-sm font-semibold text-cream">
                {t.name}, <span className="text-gold-soft">{t.business}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-navy px-6 py-12 text-center sm:py-16">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Set your business up for growth this week</h2>
        <BookNowButton className="btn-gold mt-8 w-full whitespace-normal sm:w-auto">
          Book My Business Vastu Call, {OFFER.feeLabel}
        </BookNowButton>
        <p className="mt-5 text-sm text-white/70">Vastu guidance for balance and harmony. Results are not guaranteed.</p>
      </div>
    </section>
  );
}
