"use client";

import Link from "next/link";
import { useCartStore } from "@astrokraft/core";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function CartLink({ locale }: { locale: string }) {
  const mounted = useHasMounted();
  const count = useCartStore((state) => state.getTotalCount());
  const displayCount = mounted ? count : 0;

  return (
    <Link
      href={`/${locale}/cart`}
      aria-label="View cart"
      className="relative flex shrink-0 items-center justify-center rounded-full p-1.5 sm:p-2 text-white/90 transition-colors hover:text-[#E2C27A]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path
          d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {displayCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white">
          {displayCount}
        </span>
      ) : null}
    </Link>
  );
}
