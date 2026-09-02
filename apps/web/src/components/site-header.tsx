import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Category } from "@astrokraft/db";
import { AuthHeaderControls } from "@/components/auth-header-controls";
import { CartLink } from "@/components/cart-link";
import { SiteSearchBar } from "@/components/site-search-bar";

interface SiteHeaderProps {
  categories: Category[];
  locale: string;
}

export function SiteHeader({ categories, locale }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="w-full bg-[#1B1030]">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6">
          <Link href={`/${locale}`} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Image
              src="/logo.png"
              alt="AstroKraft Logo"
              width={32}
              height={32}
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
            <span className="text-base font-bold tracking-tight text-white sm:text-lg">AstroKraft</span>
          </Link>

          <SiteSearchBar />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            <Link
              href={`/${locale}/orders`}
              aria-label="My orders"
              title="My Orders"
              className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-white/90 transition-colors hover:text-[#E2C27A] sm:p-2"
            >
              <Package className="h-[22px] w-[22px]" strokeWidth={2} />
            </Link>
            <CartLink locale={locale} />
            <AuthHeaderControls locale={locale} />
          </div>
        </div>
      </div>

      <div className="w-full bg-[#2A1A5E]">
        <div className="scrollbar-hide mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto px-3 py-2 sm:px-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/${category.slug}`}
              className="whitespace-nowrap text-xs font-medium text-white/85 transition-colors hover:text-gold sm:text-sm"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href={`/${locale}/consultation`}
            className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-gold transition-colors hover:text-white sm:text-sm"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
