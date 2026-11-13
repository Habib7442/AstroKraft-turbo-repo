import type { Metadata } from "next";
import Image from "next/image";
import { Anton, Poppins } from "next/font/google";
import { CalendarDays, Globe, Lock, Star } from "lucide-react";
import { MasterclassForm } from "@/components/masterclass/masterclass-form";
import { ReelPlayer } from "@/components/masterclass/reel-player";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import {
  WORKSHOP_DATE_LABEL,
  WORKSHOP_FEE,
  WORKSHOP_FEE_LABEL,
  WORKSHOP_WAS_LABEL,
  WORKSHOP_WHATSAPP_DISPLAY,
  WORKSHOP_WHATSAPP_URL
} from "@/lib/workshop";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-mc-display", display: "swap" });
const sans = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mc-sans", display: "swap" });

const MENTOR = "Biprangshu Bhattacharjee";
const DATE_TEXT = WORKSHOP_DATE_LABEL ?? "Next batch date on WhatsApp";

export const metadata: Metadata = {
  title: `Astro Vastu Masterclass — Live in Bengali, ${WORKSHOP_FEE_LABEL} | AstroKraft`,
  description: `Understand your own home's Vastu in one simple live session with ${MENTOR}. Taught in Bengali · ★ 4.9 · Was ${WORKSHOP_WAS_LABEL}, today ${WORKSHOP_FEE_LABEL}.`,
  alternates: { canonical: "/vastu-masterclass" },
  openGraph: {
    title: `Astro Vastu Masterclass — today ${WORKSHOP_FEE_LABEL}`,
    description: `Understand your own home's Vastu in one simple live session with ${MENTOR}. Live on Zoom, taught in Bengali.`,
    url: "/vastu-masterclass",
    siteName: "AstroKraft",
    type: "website",
    images: [{ url: "/workshop-reel-poster.webp", width: 540, height: 960, alt: `${MENTOR} — Astro Vastu Masterclass` }]
  },
  twitter: { card: "summary_large_image" }
};

const BENEFITS = ["Read your own home's Vastu", "Live practical examples", "Session recording + checklist", "Live Q&A with the expert"];

export default function VastuMasterclassPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#123066_0%,#0A1F44_40%,#06152E_100%)] font-mc-sans text-white`}
    >
      <Backdrop />

      <TopBar />

      {/* Desktop rows: [1fr, header, benefits, price, form, 1fr]. The two flexible rows absorb any spare
          height, so the left column sits vertically centred against the taller video instead of the
          video's height being spread as gaps between the left blocks. */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-6 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[1fr_auto_auto_auto_auto_1fr] lg:gap-x-14 lg:gap-y-2 lg:pb-3 lg:pt-0">
        {/* Order below = MOBILE priority order. Desktop places each block on the grid explicitly. */}
        <header className="lg:col-start-1 lg:row-start-2 lg:pt-3">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-mc-gold sm:text-sm">
            Live Online Masterclass
            <span className="h-px w-16 bg-gradient-to-r from-mc-gold to-transparent" aria-hidden />
          </p>
          <h1 className="mt-2 font-mc-display uppercase leading-[0.95]">
            <span className="block bg-[linear-gradient(180deg,#FFE08A,#F2C14E_55%,#D4A531)] bg-clip-text text-[3.4rem] text-transparent drop-shadow-[0_2px_12px_rgba(242,193,78,0.25)] sm:text-7xl lg:text-[4rem] xl:text-[4.25rem]">
              Astro Vastu
            </span>
            <span className="block text-[3.4rem] text-white sm:text-7xl lg:text-[4rem] xl:text-[4.25rem]">Masterclass</span>
          </h1>
          <span className="mt-2 block h-1 w-36 rounded-full bg-mc-gold" aria-hidden />
          <p className="mt-4 max-w-xl text-base leading-snug lg:mt-3 text-white/90 sm:text-lg">
            Understand your own home&apos;s Vastu in one simple live session with <strong className="text-white">{MENTOR}.</strong>
          </p>
        </header>

        {/* Desktop: video + date chip are one cell spanning every row, vertically centred in the column.
            The width is matched to the LEFT column's height (which barely changes with screen size), not
            to the viewport: 380px at lg (benefits wrap, so the left column is taller) and 372px at xl make
            video + chip end level with the form (measured at 1024/1280/1366/1440/1920 wide). Sizing from 100dvh made the video shrink on 768px-tall laptops while the left
            column didn't, leaving empty space bottom-right. */}
        <section
          aria-label="Intro video"
          className="mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:col-start-2 lg:row-span-6 lg:row-start-1 lg:mx-0 lg:w-[380px] lg:max-w-none lg:self-center xl:w-[372px]"
        >
          {/* Thick gold frame, as in the mockup. */}
          <div className="rounded-[30px] bg-[linear-gradient(160deg,#FFE08A,#F2C14E_40%,#D4A531)] p-[3px] shadow-[0_0_40px_-6px_rgba(242,193,78,0.55)]">
            <ReelPlayer
              src="/workshop-reel.mp4"
              poster="/workshop-reel-poster.webp"
              title={`Astro Vastu Masterclass with ${MENTOR}`}
              caption="Watch intro"
            />
          </div>
          {/* Same left/right edges as the video frame; the text wraps rather than overflowing. */}
          <DateChip className="mt-4 hidden w-full lg:flex lg:px-4 lg:text-sm xl:text-base" />
        </section>

        {/* One compact unit, only as wide as its content (justify-self-start + w-fit).
            Phones: small struck "Was ₹999" snug above "Today ₹199", no arrow.
            sm+: the single line "Was ₹999 → Today ₹199" as before. */}
        <div className="mb-2 flex w-fit flex-col justify-self-start sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4 sm:gap-y-1 lg:col-start-1 lg:row-start-4 lg:mb-1">
          <span className="text-lg leading-none text-mc-muted sm:text-2xl sm:leading-normal sm:text-white/90">
            Was{" "}
            <span className="text-white/70 line-through decoration-red-500 decoration-2 sm:decoration-[3px]">{WORKSHOP_WAS_LABEL}</span>
          </span>
          <span className="hidden text-2xl text-white/80 sm:inline" aria-hidden>
            →
          </span>
          {/* The short disclosure sits directly under "Today ₹199" (not under the struck ₹999), so it
              can only be read as describing the price actually charged. */}
          <span className="flex flex-col">
            <span className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-lg font-semibold text-white sm:text-2xl sm:font-bold">Today</span>
              <span className="font-mc-display text-6xl text-mc-gold drop-shadow-[0_0_18px_rgba(242,193,78,0.35)] sm:text-7xl lg:text-6xl">
                {WORKSHOP_FEE_LABEL}
              </span>
            </span>
            <span className="-mt-1 text-sm text-mc-muted">Workshop registration fee</span>
          </span>
        </div>

        <div className="lg:col-start-1 lg:row-start-5 lg:max-w-[560px]">
          <MasterclassForm feeLabel={WORKSHOP_FEE_LABEL} fee={WORKSHOP_FEE} />
        </div>

        <section aria-labelledby="mc-benefits" className="lg:col-start-1 lg:row-start-3">
          <h2 id="mc-benefits" className="font-mc-display text-2xl uppercase tracking-wide text-mc-gold">
            What you&apos;ll get
          </h2>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:gap-y-1">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-base text-white sm:text-lg">
                <span className="h-3 w-3 shrink-0 rounded-full bg-mc-gold shadow-[0_0_8px_rgba(242,193,78,0.7)]" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </section>

        {/* Mobile position (after the benefits); desktop shows the copy inside the video column. */}
        <DateChip className="mx-auto lg:hidden" />
      </main>

      <BottomBar />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopBar() {
  return (
    <div className="relative z-10 flex items-start justify-between gap-1 sm:gap-4">
      <div className="shrink-0 bg-[linear-gradient(135deg,#FFE08A,#F2C14E_50%,#D4A531)] py-2.5 pl-4 pr-10 [clip-path:polygon(0_0,100%_0,calc(100%-2.5rem)_100%,0_100%)] sm:pl-8 sm:pr-16">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mc-ink ring-2 ring-mc-ink">
            <Image src="/astrokraft-logo.webp" alt="" width={28} height={28} className="h-7 w-7 object-contain" priority />
          </span>
          <span className="font-mc-sans text-lg font-bold tracking-tight text-mc-ink sm:text-2xl">
            AstroKraft<sup className="text-[10px]">™</sup>
          </span>
        </div>
      </div>
      {/* Phones: two short right-aligned lines ("Taught in Bengali" / "★ 4.9") so the full phrase
          fits beside the logo; sm+: one line with the "·" separator. */}
      <p className="flex min-w-0 flex-col items-end gap-0.5 pl-1 pr-3 pt-2 text-right text-xs leading-tight text-white min-[360px]:text-[13px] sm:flex-row sm:items-center sm:gap-1.5 sm:px-8 sm:pt-3 sm:text-lg">
        {/* 360px+: stays one line. Narrower phones: may wrap rather than being clipped. */}
        <span className="min-[360px]:whitespace-nowrap">
          Taught in Bengali<span className="hidden sm:inline"> ·</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4 fill-mc-gold text-mc-gold sm:h-5 sm:w-5" aria-hidden />
          <span className="font-bold">4.9</span>
        </span>
      </p>
    </div>
  );
}

function DateChip({ className = "" }: { className?: string }) {
  return (
    <p className={`mc-chip justify-center text-center ${className}`}>
      <CalendarDays className="h-7 w-7 shrink-0 text-mc-gold" aria-hidden />
      <span>{DATE_TEXT} · Live on Zoom</span>
    </p>
  );
}

function BottomBar() {
  return (
    <footer className="relative z-10 px-4 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 rounded-2xl border-2 border-mc-gold/70 bg-mc-ink/80 px-5 py-3 text-sm text-white sm:flex-row sm:justify-between sm:rounded-full sm:text-base">
        <a href="https://www.astrokraft.online/en" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-mc-gold">
          <Globe className="h-5 w-5 text-mc-gold" aria-hidden /> www.astrokraft.online
        </a>
        <span className="hidden h-5 w-px bg-mc-gold/60 sm:block" aria-hidden />
        <a href={WORKSHOP_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-mc-gold">
          <WhatsAppIcon className="h-5 w-5" /> WhatsApp {WORKSHOP_WHATSAPP_DISPLAY}
        </a>
        <span className="hidden h-5 w-px bg-mc-gold/60 sm:block" aria-hidden />
        <span className="inline-flex items-center gap-2">
          <Lock className="h-5 w-5 text-mc-gold" aria-hidden /> Secure payment by <span className="font-bold italic">Razorpay</span>
        </span>
      </div>
    </footer>
  );
}

/** Stars, faint compass + mandala line art, and the gold corner wedges — all decorative. */
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="mc-stars absolute inset-0 opacity-60" />
      <svg viewBox="0 0 200 200" className="absolute left-[38%] top-[34%] hidden h-72 w-72 opacity-[0.12] lg:block" fill="none" stroke="#F2C14E">
        <circle cx="100" cy="100" r="70" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="58" strokeWidth="0.5" strokeDasharray="2 3" />
        <path d="M100 18 L108 92 L100 100 L92 92 Z M100 182 L92 108 L100 100 L108 108 Z M18 100 L92 92 L100 100 L92 108 Z M182 100 L108 108 L100 100 L108 92 Z" strokeWidth="0.8" />
        <path d="M100 100 L150 50 M100 100 L50 150 M100 100 L50 50 M100 100 L150 150" strokeWidth="0.5" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute -right-24 top-8 h-[30rem] w-[30rem] opacity-[0.08]" fill="none" stroke="#F2C14E" strokeWidth="0.6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i} cx="100" cy="100" rx="22" ry="78" transform={`rotate(${i * 15} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="90" />
        <circle cx="100" cy="100" r="30" />
      </svg>
      {/* Desktop only: on a phone the wedges would sit on top of the eyebrow and the footer. */}
      {/* xl+ only: below 1280px the content's left edge is close enough that it would cover the eyebrow. */}
      <div className="absolute -left-10 top-16 hidden h-40 w-24 bg-[linear-gradient(135deg,#F2C14E,#D4A531)] opacity-90 [clip-path:polygon(0_0,100%_0,0_100%)] xl:block" />
      <div className="absolute -bottom-2 -right-2 hidden h-44 w-56 bg-[linear-gradient(315deg,#F2C14E,#D4A531)] opacity-90 [clip-path:polygon(100%_0,100%_100%,0_100%)] lg:block" />
    </div>
  );
}
