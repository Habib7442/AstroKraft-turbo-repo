"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Category } from "@astrokraft/db";

// Vastu New Home / Construction Planning's full name is too long for a nav
// item — shortened here for display only, the link/slug is untouched.
const LABEL_OVERRIDES: Record<string, string> = {
  "vastu-new-home-construction-planning": "Home & Construction"
};

interface VastuNavDropdownProps {
  categories: Category[];
  locale: string;
}

const PANEL_WIDTH = 256; // w-64
const VIEWPORT_MARGIN = 12;

export function VastuNavDropdown({ categories, locale }: VastuNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The category row scrolls horizontally on mobile (overflow-x-auto),
  // which implicitly clips overflow-y too — an absolutely-positioned panel
  // nested inside it gets cut off almost entirely instead of floating over
  // the page. Rendering the panel through a portal with position: fixed,
  // placed from the button's own bounding rect, sidesteps that clipping
  // entirely regardless of where in the DOM the trigger button sits.
  //
  // A fixed-position element isn't clipped by ancestors, but it also isn't
  // reflowed to stay on-screen — on a narrow viewport, anchoring left edge
  // to the button's own left edge (which sits fairly far right in a
  // horizontally-scrolled nav row) pushed most of the 256px-wide panel past
  // the right edge of the screen entirely. Clamp so the whole panel always
  // stays within the viewport.
  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN);
    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), maxLeft);
    setPosition({ top: rect.bottom + 8, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-white/85 transition-colors hover:text-gold sm:text-sm"
      >
        Vastu
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: position.top, left: position.left }}
              className="fixed z-[100] w-64 overflow-hidden rounded-lg border border-surface-border bg-white py-1.5 shadow-lg"
              onKeyDown={(e) => {
                // The panel is portaled to document.body, well outside the
                // trigger button in tab order — a keyboard user tabbing
                // through would otherwise pass through unrelated header/page
                // controls before ever reaching it, and there was no way to
                // close it without a mouse.
                if (e.key === "Escape") {
                  setOpen(false);
                  buttonRef.current?.focus();
                }
              }}
            >
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/${locale}/${category.slug}`}
                  onClick={() => setOpen(false)}
                  autoFocus={index === 0}
                  className="block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-tint hover:text-primary"
                >
                  {LABEL_OVERRIDES[category.slug] ?? category.name}
                </Link>
              ))}
              <div className="my-1 border-t border-surface-border" />
              <Link
                href={`/${locale}/purohit-booking`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-tint hover:text-primary"
              >
                Book a Purohit
              </Link>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
