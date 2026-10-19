import {
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  ClipboardList,
  Compass,
  Factory,
  Gem,
  Hotel,
  Lightbulb,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Store,
  TrendingDown,
  Users,
  UtensilsCrossed,
  Video,
  Wallet,
  X
} from "lucide-react";
import type { PlatformReview } from "@astrokraft/db";
import { BookingProvider, BookNowButton } from "@/components/booking";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { getSupabasePublicClient } from "@/lib/supabase";
import {
  BRAND,
  CONSULTATION_FEE_LABEL,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  FOUNDER,
  FOUNDER_PHOTO,
  WHATSAPP_URL
} from "@/lib/site";

const PROBLEMS = [
  { icon: TrendingDown, title: "Sales not growing", text: "Footfall or orders have flattened despite effort and marketing spend." },
  { icon: Banknote, title: "Cash flow pressure", text: "Money comes in but doesn't stay — payments get stuck, expenses keep rising." },
  { icon: Building2, title: "Expansion feels blocked", text: "A new branch, floor or unit keeps getting delayed or doesn't take off." },
  { icon: Users, title: "Workplace issues", text: "Staff turnover, conflicts or low energy in the team and the workspace." }
];

const OFFER = [
  { icon: Search, title: "Business Space Assessment", text: "A structured look at your shop, office or unit — entrance, cash counter, seating, storage and flow." },
  { icon: Compass, title: "Vastu Observations", text: "Clear, specific observations on what in your space may be working against your goals." },
  { icon: Lightbulb, title: "Personalised Guidance", text: "Practical, actionable steps for your business — prioritised, so you know what to do first." }
];

const WHO = [
  { icon: Gem, label: "Jewellery Showrooms", text: "Display, locker and cash counter placement, and how customers move through the showroom." },
  { icon: ShoppingBag, label: "Retail Shops", text: "Entrance, billing counter and stock areas — so the shop invites footfall instead of turning it away." },
  { icon: Hotel, label: "Hotels", text: "Reception, kitchen, rooms and owner's cabin, looked at together as one guest experience." },
  { icon: UtensilsCrossed, label: "Restaurants & Cafes", text: "Kitchen and fire placement, seating, entrance and cash counter for a busy, steady business." },
  { icon: Factory, label: "Factories", text: "Machinery, raw material and finished-goods storage, dispatch and office — around your production flow." },
  { icon: Building2, label: "Builders & Developers", text: "Plot orientation and layout decisions before construction, when changes cost the least." },
  { icon: Store, label: "Offices", text: "Owner's seat, team seating, meeting rooms and accounts — for decisions, focus and teamwork." },
  { icon: ClipboardList, label: "Clinics & Others", text: "Any working business space — salons, clinics, coaching centres, warehouses and more." }
];

const WHY = [
  { icon: TrendingDown, title: "Business-first approach", text: "Your space is discussed in the context of your sales, customers, team and growth plans — not in isolation." },
  { icon: Wallet, title: "Practical & budget-aware", text: "The focus is on changes a running business can actually make, prioritised so you start with what matters most." },
  { icon: Building2, title: "No demolition mindset", text: "Most guidance works with your existing layout — rearrangement, placement and usage — before anything structural." },
  { icon: Users, title: "Directly with the founder", text: `Every ${CONSULTATION_FEE_LABEL} consultation is a 1:1 session with ${FOUNDER} himself.` },
  { icon: Video, title: "From anywhere in India", text: "The consultation is online. Share your floor plan or photos and get guidance without waiting for a visit." },
  { icon: BadgeCheck, title: "Honest guidance", text: "Clear observations and next steps — no fear-based advice and no pressure to buy expensive remedies." }
];

const INCLUDED = [
  "One focused 1:1 consultation with Biprangshu",
  "Discussion of your business, space and growth goals",
  "Review of your floor plan or space photos (if shared)",
  "Key Vastu observations for your business space",
  "Prioritised, practical recommendations",
  "Guidance on next steps for expansion or a new space"
];

const EXCLUDED = [
  "Physical site visit",
  "Detailed remedial drawings or layout redesign",
  "Ongoing follow-up consultations",
  "Construction, renovation or interior work"
];

const STEPS = [
  { title: "Share a few details", text: "Tell us about your business in a 60-second form." },
  { title: `Pick a slot & pay ${CONSULTATION_FEE_LABEL}`, text: "Choose a time that suits you and pay securely online." },
  { title: "Get confirmation", text: "Receive SMS & email confirmation instantly. Share your floor plan on WhatsApp." },
  { title: "Your 1:1 consultation", text: "Discuss your space and goals, and leave with clear, actionable guidance." }
];

const FAQS = [
  {
    q: "What is Business Vastu?",
    a: "Vastu Shastra is the traditional Indian science of space and direction. Business Vastu applies it to working spaces — shops, showrooms, offices, factories, hotels and restaurants — looking at entrances, cash and storage areas, seating and the flow of people and goods."
  },
  {
    q: "Does Vastu apply to a rented shop or office?",
    a: "Yes. Much of the guidance is about how a space is used — where you sit, where cash and stock are kept, how the entrance and counters are arranged — which you can change in a rented space too."
  },
  {
    q: "How is the consultation conducted?",
    a: "It is a 1:1 online consultation. Your booking confirmation will include the joining details for your selected slot."
  },
  {
    q: "Do I need a floor plan?",
    a: "A floor plan helps, but it isn't mandatory. If you don't have one, photos or a rough hand-drawn sketch of your space with directions marked works well."
  },
  {
    q: "Will I need to demolish or rebuild anything?",
    a: "The focus is on practical, actionable guidance for a working business. Any recommendation is discussed with your budget and operations in mind."
  },
  {
    q: "How should I prepare for the call?",
    a: "Keep your floor plan (or photos of each area) ready with the main entrance direction marked, and note down the 2–3 business problems you most want to discuss. Share them on WhatsApp before the call if you can."
  },
  {
    q: "Do you offer site visits?",
    a: `The ${CONSULTATION_FEE_LABEL} consultation is online. On-site visits and detailed planning for new spaces are available as premium services — ask about them during your consultation or on WhatsApp.`
  },
  {
    q: "Can I reschedule my slot?",
    a: "Yes. Use the reschedule link in your confirmation email, subject to our Refund & Rescheduling Policy."
  },
  {
    q: "Is Vastu a guarantee of business results?",
    a: "No. Vastu guidance is one input alongside your business decisions. We share honest observations and practical steps; outcomes depend on many factors."
  },
  {
    q: "What happens after the consultation?",
    a: "Many business owners only need this session. If you want deeper support — a site visit, detailed planning for a new space or ongoing guidance — premium services are available, and we'll discuss them only if you're interested."
  }
];

type Review = Pick<PlatformReview, "id" | "name" | "rating" | "comment">;

// Testimonials are AstroKraft's own approved platform reviews (same query as
// the AstroKraft homepage), refreshed every 5 minutes.
export const revalidate = 300;

async function getAstroKraftReviews(): Promise<Review[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("platform_reviews")
    .select("id, name, rating, comment")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(9);
  if (error) console.error("platform_reviews fetch failed:", error);
  return data ?? [];
}

export default async function Home() {
  const reviews = await getAstroKraftReviews();
  return (
    <BookingProvider>
      <SiteHeader />
      <main className="pb-24 sm:pb-0">
        <Hero />
        <About />
        <Problems />
        <Offer />
        <WhoCanBook />
        <WhyChoose />
        <HowItWorks />
        <Inclusions />
        <Testimonials reviews={reviews} />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta />
    </BookingProvider>
  );
}

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className={`gold-text font-display font-bold tracking-[0.12em] ${small ? "text-xl" : "text-4xl"}`}>VASTU</span>
      <span className={`font-display tracking-[0.25em] text-gold-soft ${small ? "mt-0.5 text-[8px]" : "mt-1 text-[11px]"}`}>
        by BIPRANGSHU<sup className="ml-0.5">™</sup>
      </span>
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold-line/60 bg-night/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" aria-label={BRAND}>
          <Wordmark small />
        </a>
        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-2 text-xs font-semibold text-gold-soft"
          >
            <WhatsAppIcon className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <BookNowButton className="hidden rounded-full bg-gold-gradient px-4 py-2 text-xs font-extrabold uppercase text-night sm:inline-flex">
            Book Now
          </BookNowButton>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.18),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-10 text-center sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <p className="font-display text-[10px] tracking-[0.3em] text-muted sm:text-xs">BUSINESS SPACES · PEOPLE · PROSPERITY</p>

        <p className="eyebrow mt-8">For Business Owners</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-[2.1rem] font-extrabold leading-[1.1] sm:text-6xl">
          <span className="text-cream">Is Your Business Space </span>
          <span className="text-crimson">Supporting Your Growth?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-cream/85 sm:text-lg">
          A personalised <strong className="text-gold-soft">1:1 Business Vastu Consultation</strong> to understand your business, your space
          and your growth goals.
        </p>

        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 text-left text-sm sm:grid-cols-4">
          {["Identify Vastu blocks in your space", "Personalised solutions for your goals", "Clarity on expansion & team", "Practical, actionable guidance"].map(
            (t) => (
              <li key={t} className="flex items-start gap-2 rounded-xl border border-gold-line bg-night-800/60 p-3 text-cream/90">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {t}
              </li>
            )
          )}
        </ul>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gold/40 bg-gradient-to-b from-gold/15 to-transparent p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-soft">1:1 Vastu Consultation</p>
          <p className="mt-1 text-5xl font-extrabold text-cream">{CONSULTATION_FEE_LABEL}</p>
          <BookNowButton className="btn-gold mt-5 w-full" />
          <p className="mt-3 text-xs text-muted">Pick your slot · Pay securely online · Instant SMS confirmation</p>
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

function Problems() {
  return (
    <section className="section">
      <SectionHead eyebrow="Sound familiar?" title="Common challenges business owners face" sub="Sometimes the space you work in quietly adds to these." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PROBLEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex gap-4">
            <Icon className="h-6 w-6 shrink-0 text-crimson" aria-hidden />
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

function Offer() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <SectionHead eyebrow="What we offer" title="A focused consultation built around your business" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
        title="For every kind of business space"
        sub="Every business uses its space differently, so the consultation looks at what matters most for yours."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

function About() {
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section grid items-center gap-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="mx-auto w-full max-w-xs">
          {FOUNDER_PHOTO ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FOUNDER_PHOTO}
              alt={FOUNDER}
              width={384}
              height={512}
              fetchPriority="high"
              className="aspect-[3/4] w-full rounded-2xl border border-gold/40 object-cover object-[25%_center]"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-gold/40 bg-gradient-to-b from-night-700 to-night-900">
              <span className="gold-text font-display text-7xl font-bold">BB</span>
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">Meet your consultant</p>
          <h2 className="section-title">{FOUNDER}</h2>
          <p className="mt-2 font-semibold text-gold-soft">Founder, {BRAND} &amp; AstroKraft · Business &amp; Vastu Consultant</p>
          <p className="mt-4 text-cream/85">
            Biprangshu brings a business lens to Vastu. He looks at your space the way you look at your business — sales,
            customers, cash flow, team and growth — and connects Vastu principles to practical decisions you can actually act on.
          </p>
          <p className="mt-3 text-cream/85">
            As the founder of AstroKraft, a Vedic astrology and certified-gemstone brand, he helps people apply traditional Indian wisdom to
            real-life decisions. {BRAND} brings that same approach to business owners and their workplaces.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {["Founder of AstroKraft", "Every session 1:1 with Biprangshu", "Online across India"].map((t) => (
              <li key={t} className="flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-gold-soft">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <BookNowButton className="btn-gold mt-6">Book with Biprangshu</BookNowButton>
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="section">
      <SectionHead
        eyebrow={`Why ${BRAND}`}
        title="Vastu guidance that respects how your business runs"
        sub="Many business owners avoid Vastu because they expect demolition, fear or costly remedies. This consultation is built the other way round."
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

function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="border-y border-gold-line/50 bg-night-800/40">
      <div className="section">
        <SectionHead
          eyebrow="Testimonials"
          title="What people say about AstroKraft"
          sub={`Verified reviews from customers of AstroKraft, the Vedic astrology and gemstone brand founded by ${FOUNDER}.`}
        />
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card flex w-[82%] shrink-0 snap-start flex-col sm:w-auto">
              <div className="text-sm text-gold" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}
                <span className="text-night-600">{"★".repeat(5 - r.rating)}</span>
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-cream/85">“{r.comment}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-cream">{r.name}</span>
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
      <SectionHead eyebrow={`What ${CONSULTATION_FEE_LABEL} covers`} title="Consultation inclusions" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-bold text-gold-soft">Included</h3>
          <ul className="mt-3 space-y-2.5">
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-cream/90">
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
          <p className="mt-4 text-xs text-muted">Available separately as premium business Vastu services.</p>
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-extrabold text-night">{i + 1}</span>
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
      <SectionHead eyebrow="FAQs" title="Questions business owners ask" />
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
      <div className="mx-auto max-w-3xl rounded-3xl border border-gold/40 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.18),transparent_70%)] px-6 py-12 text-center">
        <h2 className="text-3xl font-extrabold text-cream sm:text-4xl">
          Make your space work <span className="gold-text">for</span> your business
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">Book your personalised 1:1 Business Vastu Consultation today.</p>
        <p className="mt-6 text-4xl font-extrabold text-cream">{CONSULTATION_FEE_LABEL}</p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <BookNowButton className="btn-gold w-full sm:w-auto" />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-outline w-full sm:w-auto">
            <WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-gold-line/60 bg-night-900">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Wordmark small />
          <div className="space-y-2">
            <a href={`tel:+91${CONTACT_PHONE}`} className="flex items-center gap-2 hover:text-cream">
              <Phone className="h-4 w-4" aria-hidden /> +91 {CONTACT_PHONE}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-cream">
              <Mail className="h-4 w-4" aria-hidden /> {CONTACT_EMAIL}
            </a>
          </div>
          <nav className="flex flex-col gap-2">
            <a href="/policies#privacy" className="hover:text-cream">Privacy Policy</a>
            <a href="/policies#payment" className="hover:text-cream">Payment Terms</a>
            <a href="/policies#refunds" className="hover:text-cream">Refund &amp; Rescheduling</a>
          </nav>
        </div>
        <p className="mt-8 text-xs leading-relaxed text-muted/80">
          Disclaimer: Vastu consultation offers guidance based on traditional principles and is not a guarantee of any financial or business
          outcome. It is not a substitute for professional legal, financial, structural or engineering advice.
        </p>
        <p className="mt-4 text-xs text-muted/70">
          © {new Date().getFullYear()} {BRAND}™. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-line bg-night/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="flex items-center gap-3">
        <div className="shrink-0 leading-tight">
          <p className="text-[11px] uppercase tracking-wider text-muted">1:1 Consultation</p>
          <p className="text-xl font-extrabold text-cream">{CONSULTATION_FEE_LABEL}</p>
        </div>
        <BookNowButton className="btn-gold min-w-0 flex-1 px-4 py-3.5 text-sm" />
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full border border-gold/50 p-3 text-gold">
          <WhatsAppIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
