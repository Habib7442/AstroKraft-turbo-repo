"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function SiteSearchBar() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`);
      setMobileOpen(false);
    }
  };

  const searchForm = (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search gemstones, Rudraksha, bracelets…"
        aria-label="Search products"
        className="min-w-0 flex-1 rounded-l-md border-none px-3 py-2 text-sm text-foreground focus:outline-none sm:px-4 sm:py-2.5"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center justify-center rounded-r-md bg-gold px-3 transition-colors hover:bg-gold/90 sm:px-4"
      >
        <Search className="h-[18px] w-[18px] text-[#221A3D]" strokeWidth={2.5} />
      </button>
    </form>
  );

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end sm:justify-start">
      <div className="hidden w-full max-w-xs sm:flex md:max-w-sm lg:max-w-none">{searchForm}</div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Search"
            className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-white/90 transition-colors hover:text-[#E2C27A] sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Search AstroKraft</SheetTitle>
          </SheetHeader>
          <div className="overflow-hidden rounded-md border border-surface-border">{searchForm}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
