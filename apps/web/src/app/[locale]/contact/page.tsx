import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { PolicyPage } from "@/components/policy-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Contact Us",
    description: "Get in touch with AstroKraft — Rangirkhari, Silchar, Assam.",
    path: "/contact",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PolicyPage title="Contact Us" updatedAt="September 2, 2026">
      <p>We&rsquo;d love to hear from you. Reach us through any of the channels below.</p>

      <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-card p-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-lg text-gold">📍</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Address</p>
            <p className="mt-0.5 text-foreground">Rangirkhari, Silchar, Assam, India</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-lg text-gold">✉️</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Email</p>
            <a href="mailto:vastubipra@gmail.com" className="mt-0.5 block text-primary underline underline-offset-2">
              vastubipra@gmail.com
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-lg text-gold">🕒</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Hours</p>
            <p className="mt-0.5 text-foreground">Monday – Saturday, 10:00 AM – 7:00 PM IST</p>
          </div>
        </div>
      </div>

      <p>
        For questions about an existing order or consultation, please include your order number or booking name so
        we can help you faster.
      </p>
    </PolicyPage>
  );
}
