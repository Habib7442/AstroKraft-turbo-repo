import {
  BadgeCheck,
  Building,
  Building2,
  Check,
  FileText,
  Globe,
  House,
  KeyRound,
  Lightbulb,
  Search,
  Sparkles,
  Users,
  Video,
  Wallet,
  X
} from "lucide-react";
import { BookingProvider, BookNowButton } from "@/components/booking";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { VideoStories } from "@/components/video-stories";
import { SiteFooter, SiteHeader, StickyCta } from "@/components/site-chrome";
import { TESTIMONIALS } from "@/lib/testimonials";
import { AboutFounder } from "@/components/about-founder";
import {
  BRAND,
  CONSULTATION_FEE_LABEL,
  FOUNDER,
  WHATSAPP_URL
} from "@/lib/site";

const HERO_INCLUDES = [
  "Floor plan check: main door, kitchen, bedrooms, toilets",
  "Written report with your major Vastu defects",
  "30-minute one-to-one call with the expert",
  "Simple remedies that need no construction"
];

const FLAT_PROBLEMS = [
  { icon: Wallet, title: "Money and growth", text: "Savings not building, payments delayed, income stuck." },
  { icon: Users, title: "Family peace", text: "Frequent fights, poor sleep, health worries at home." },
  { icon: Building2, title: "Buying a flat", text: "Check a flat before you pay the booking amount." }
];

const OFFER = [
  { icon: Search, title: "Floor plan check", text: "Main door, kitchen, bedrooms, toilets and balcony — checked direction by direction." },
  { icon: FileText, title: "Written Vastu report", text: "Your major Vastu defects in plain language, so you know what is wrong and where." },
  { icon: Video, title: "30-minute expert call", text: `One-to-one with ${FOUNDER} to walk through your report and answer your questions.` },
  { icon: Lightbulb, title: "Simple remedies", text: "Placement, colour and usage fixes, prioritised — with no breaking of walls." }
];

const WHO = [
  { icon: House, label: "Flat owners", text: "Living in your flat and facing money, health or family worries." },
  { icon: KeyRound, label: "Tenants", text: "Renting? Most fixes are placement and usage changes you can make without the landlord." },
  { icon: Building2, label: "Flat buyers", text: "Check a flat's Vastu before you pay the booking amount." },
  { icon: Sparkles, label: "Moving in soon", text: "Griha pravesh coming up? Set up rooms and furniture right from day one." },
  { icon: Building, label: "Any apartment", text: "1BHK to 4BHK, any floor, any facing — builder flats and resale flats." },
  { icon: Globe, label: "Anywhere in India", text: "Fully online. Share your floor plan on WhatsApp from any city." }
];

const WHY = [
  { icon: Building2, title: "No demolition", text: "Remedies work with your existing walls — rearrangement, placement and colour, not construction." },
  { icon: Wallet, title: "Practical & budget-aware", text: "Fixes are prioritised so you start with what matters most, without expensive products." },
  { icon: Users, title: "Directly with the founder", text: `Every ${CONSULTATION_FEE_LABEL} call is one-to-one with ${FOUNDER} himself.` },
  { icon: FileText, title: "A report you keep", text: "Your defects and fixes in writing, so nothing from the call is forgotten." },
  { icon: Video, title: "Fully online", text: "Share your floor plan or photos on WhatsApp and get guidance without waiting for a visit." },
  { icon: BadgeCheck, title: "Honest guidance", text: "Clear observations and next steps — no fear-based advice and no pressure to buy remedies." }
];

const INCLUDED = [
  "Floor plan check: main door, kitchen, bedrooms, toilets",
  "Written report with your major Vastu defects",
  `30-minute one-to-one call with ${FOUNDER}`,
  "Simple remedies that need no construction",
  "Review of photos or a hand-drawn sketch if you have no floor plan",
  "Guidance before buying or moving into a flat"
];

const EXCLUDED = [
  "Physical site visit",
  "Detailed remedial drawings or layout redesign",
  "Ongoing follow-up consultations",
  "Construction, renovation or interior work"
];

const STEPS = [
  { title: "Share a few details", text: "Name, WhatsApp and city — it takes under a minute." },
  { title: `Pick a slot & pay ${CONSULTATION_FEE_LABEL}`, text: "Choose a call time and pay securely by UPI or card." },
  { title: "Send your floor plan", text: "Share the floor plan, or photos of each room, on WhatsApp." },
  { title: "Get your report & call", text: `Receive your written report and talk it through one-to-one with ${FOUNDER}.` }
];

const FAQS = [
  {
    q: `What does the ${CONSULTATION_FEE_LABEL} include?`,
    a: `A floor plan check (main door, kitchen, bedrooms, toilets), a written report of your major Vastu defects, a 30-minute one-to-one call with ${FOUNDER}, and simple remedies that need no construction.`
  },
  {
    q: "I don't have a floor plan. Can I still book?",
    a: "Yes. Photos of each room and the main door, or a rough hand-drawn sketch with directions marked, work well."
  },
  {
    q: "Will I need to break walls or rebuild anything?",
    a: "No. The remedies focus on placement, colour and how rooms are used — changes you can make in a finished flat."
  },
  {
    q: "I live in a rented flat. Does Vastu still apply?",
    a: "Yes. Much of the guidance is about where you sleep, cook and keep money, and how rooms are used — which you can change in a rented flat too."
  },
  {
    q: "Can you check a flat before I buy it?",
    a: "Yes. Share the floor plan from the builder or seller, and you'll know its major Vastu defects before you pay the booking amount."
  },
  {
    q: "How is the call done?",
    a: "It is a one-to-one online call. Your booking confirmation includes the joining details for your selected slot."
  },
  {
    q: "How do I get my written report?",
    a: "Your report covers the major Vastu defects found in your floor plan, and it is discussed with you on your call."
  },
  {
    q: "Do you offer site visits?",
    a: `The ${CONSULTATION_FEE_LABEL} call is online. On-site visits are available as a premium service — ask about them on WhatsApp or during your call.`
  },
  {
    q: "Is Vastu a guarantee of results?",
    a: "No. Vastu guidance is for balance and harmony at home; outcomes depend on many factors. We share honest observations and practical steps."
  }
];

export default function Home() {
  return (
    <BookingProvider>
      <SiteHeader whatsappUrl={WHATSAPP_URL} />
      <main className="pb-24 sm:pb-0">
        <Hero />
        <FlatProblems />
        <AboutFounder />
        <VideoStories />
        <Offer />
        <WhoCanBook />
        <WhyChoose />
        <HowItWorks />
        <Inclusions />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta feeLabel={CONSULTATION_FEE_LABEL} whatsappUrl={WHATSAPP_URL} />
    </BookingProvider>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy">
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="eyebrow !text-gold-bright">Vastu for home and flat</p>
          <h1 className="mt-3 text-[2.5rem] font-extrabold leading-[1.05] text-white sm:text-6xl">
            Get Your Flat Vastu <span className="text-gold-bright">Report + Expert Call</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Money stuck? Constant tension at home? Find out what your flat is doing to you, with simple fixes that need no breaking of walls.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <BookNowButton className="btn-gold w-full sm:w-auto">Book My Vastu Call</BookNowButton>
            <p className="text-center text-sm text-white/70 sm:text-left">
              Only <strong className="text-gold-bright">{CONSULTATION_FEE_LABEL}</strong>. Report and call included.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-gold-bright bg-white p-6 shadow-2xl shadow-black/30">
          <h2 className="text-lg font-bold text-cream">What you get for {CONSULTATION_FEE_LABEL}</h2>
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

function FlatProblems() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <h2 className="section-title text-center">Is your flat working against you?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FLAT_PROBLEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card">
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

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="mt-3 text-muted">{sub}</p>}
    </div>
  );
}

function Offer() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <SectionHead eyebrow="What you get" title={`Everything in your ${CONSULTATION_FEE_LABEL} Flat Vastu package`} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OFFER.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50">
                <Icon className="h-6 w-6 text-gold" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-cream">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoCanBook() {
  return (
    <section className="section">
      <SectionHead
        eyebrow="Who can book"
        title="For every kind of flat and home"
        sub="Whether you own, rent or are about to buy, the check looks at what matters most in your flat."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WHO.map(({ icon: Icon, label, text }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 shrink-0 text-gold" aria-hidden />
              <h3 className="text-sm font-bold text-cream">{label}</h3>
            </div>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="section">
      <SectionHead
        eyebrow={`Why ${BRAND}`}
        title="Vastu guidance that fits how your family lives"
        sub="Many people avoid Vastu because they expect demolition, fear or costly remedies. This is built the other way round."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex gap-4">
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden />
            <div>
              <h3 className="font-bold text-cream">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <SectionHead eyebrow="Testimonials" title="What our clients say" sub="Clients of VASTU by Biprangshu, in their own words." />
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card flex w-[85%] shrink-0 snap-start flex-col sm:w-auto">
              <span className="font-display text-4xl leading-none text-gold" aria-hidden>
                “
              </span>
              <blockquote className="mt-1 flex-1 text-sm leading-relaxed text-cream">{t.quote}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-night-600 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                  {t.name.replace(/^Dr\.\s*/, "").charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-cream">{t.name}</span>
                  <span className="block text-xs text-gold-soft">{t.business}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Inclusions() {
  return (
    <section className="section">
      <SectionHead eyebrow={`What ${CONSULTATION_FEE_LABEL} covers`} title="What's included" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-bold text-gold-soft">Included</h3>
          <ul className="mt-3 space-y-2.5">
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-cream">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-bold text-muted">Not included</h3>
          <ul className="mt-3 space-y-2.5">
            {EXCLUDED.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-muted">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-crimson/80" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Available separately as premium Vastu services.</p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <SectionHead eyebrow="How booking works" title="Booked in under 2 minutes" />
        <ol className="mt-8 grid gap-4 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-extrabold text-navy">{i + 1}</span>
              <h3 className="mt-3 font-bold text-cream">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="section">
      <SectionHead eyebrow="FAQs" title="Questions flat owners ask" />
      <div className="mt-8 divide-y divide-night-600 rounded-2xl border border-gold-line">
        {FAQS.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-cream">
              {f.q}
              <span className="text-gold transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-navy px-6 py-12 text-center sm:py-16">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Get clarity on your flat this week
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">Your Flat Vastu Report + 30-minute expert call, one-to-one with Biprangshu.</p>
        <p className="mt-6 text-4xl font-extrabold text-white">{CONSULTATION_FEE_LABEL}</p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <BookNowButton className="btn-gold w-full sm:w-auto" />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-outline w-full !border-white/40 !text-white hover:!bg-white/10 sm:w-auto">
            <WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
