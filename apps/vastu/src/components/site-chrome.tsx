import { Mail, Phone } from "lucide-react";
import { BookNowButton } from "@/components/booking";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { BRAND, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/site";

// Header, footer and mobile sticky CTA shared by the Flat (/) and Business
// (/business-vastu) landing pages. Must render inside a BookingProvider.

export function Wordmark({ small = false, onDark = false }: { small?: boolean; onDark?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span
        className={`font-display font-bold tracking-[0.12em] ${onDark ? "text-gold-bright" : "gold-text"} ${small ? "text-xl" : "text-4xl"}`}
      >
        VASTU
      </span>
      <span
        className={`font-display tracking-[0.25em] ${onDark ? "text-gold-bright" : "text-gold-soft"} ${small ? "mt-0.5 text-[8px]" : "mt-1 text-[11px]"}`}
      >
        by BIPRANGSHU<sup className="ml-0.5">™</sup>
      </span>
    </span>
  );
}

export function SiteHeader({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" aria-label={BRAND}>
          <Wordmark small onDark />
        </a>
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-2 text-xs font-semibold text-white"
          >
            <WhatsAppIcon className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <BookNowButton className="hidden rounded-full bg-gold-gradient px-4 py-2 text-xs font-extrabold uppercase text-navy sm:inline-flex">
            Book Now
          </BookNowButton>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-white/70 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Wordmark small onDark />
          <div className="space-y-2">
            <a href={`tel:+91${CONTACT_PHONE}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4" aria-hidden /> +91 {CONTACT_PHONE}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4" aria-hidden /> {CONTACT_EMAIL}
            </a>
          </div>
          <nav className="flex flex-col gap-2">
            <a href="/policies#privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/policies#payment" className="hover:text-white">Payment Terms</a>
            <a href="/policies#refunds" className="hover:text-white">Refund &amp; Rescheduling</a>
          </nav>
        </div>
        <p className="mt-8 text-xs leading-relaxed text-white/50">
          Disclaimer: Vastu consultation offers guidance based on traditional principles and is not a guarantee of any financial or business
          outcome. It is not a substitute for professional legal, financial, structural or engineering advice.
        </p>
        <p className="mt-4 text-xs text-white/50">
          © {new Date().getFullYear()} {BRAND}™. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function StickyCta({ feeLabel, whatsappUrl }: { feeLabel: string; whatsappUrl: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-line bg-night/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="flex items-center gap-3">
        <div className="shrink-0 leading-tight">
          <p className="text-[11px] uppercase tracking-wider text-muted">Report + Call</p>
          <p className="text-xl font-extrabold text-cream">{feeLabel}</p>
        </div>
        <BookNowButton className="btn-gold min-w-0 flex-1 px-4 py-3.5 text-sm" />
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full border border-gold/50 p-3 text-gold">
          <WhatsAppIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
