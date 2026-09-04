import Image from "next/image";
import Link from "next/link";
import type { Category } from "@astrokraft/db";

interface SiteFooterProps {
  categories: Category[];
  locale: string;
}

export function SiteFooter({ categories, locale }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const companyLinks = [
    { label: "Home", href: `/${locale}` },
    { label: "About Us", href: `/${locale}/about` },
    { label: "Contact Us", href: `/${locale}/contact` },
    { label: "Book a Consultation", href: `/${locale}/consultation` },
    { label: "My Orders", href: `/${locale}/orders` }
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: `/${locale}/privacy-policy` },
    { label: "Terms & Conditions", href: `/${locale}/terms-conditions` },
    { label: "Shipping & Exchange", href: `/${locale}/shipping-policy` },
    { label: "Refund & Cancellation Policy", href: `/${locale}/refund-policy` }
  ];

  return (
    <footer className="w-full bg-[#1B1030] text-white/80">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image src="/logo.png" alt="AstroKraft Logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-lg font-bold tracking-tight text-white">AstroKraft</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Authentic Vedic astrology consultations and lab-certified gemstones, Rudraksha & Vastu solutions —
              trusted by clients across India.
            </p>
            <address className="mt-5 flex flex-col gap-2 text-sm not-italic text-white/60">
              <span className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-gold">📍</span>
                Rangirkhari, Silchar, Assam, India
              </span>
              <a href="mailto:vastubipra@gmail.com" className="flex items-center gap-2 transition-colors hover:text-gold">
                <span aria-hidden className="text-gold">✉️</span>
                vastubipra@gmail.com
              </a>
            </address>
          </div>

          {categories.length > 0 ? (
            <div className="lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-white">Shop</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/${locale}/${category.slug}`}
                      className="text-sm text-white/60 transition-colors hover:text-gold"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white">Company</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white">Legal</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            &copy; {year} AstroKraft. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-white/50">
            <span aria-hidden>🔒</span>
            Secure payments powered by Razorpay
          </p>
        </div>
      </div>
    </footer>
  );
}
