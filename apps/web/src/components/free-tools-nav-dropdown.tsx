"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface FreeToolsNavDropdownProps {
  locale: string;
}

const PANEL_WIDTH = 240;
const VIEWPORT_MARGIN = 12;

const TOOLS = [
  { href: "horoscope", label: "Daily Horoscope", icon: "☀️" },
  { href: "free-kundli", label: "Free Kundli", icon: "🪔" },
  { href: "gemstone-recommendation", label: "Gemstone Finder", icon: "💎" }
];

// Same portal + fixed-position pattern as VastuNavDropdown, for the same
// reason: this button sits inside the horizontally-scrolling nav row, whose
// overflow-x-auto implicitly clips overflow-y too.
export function FreeToolsNavDropdown({ locale }: FreeToolsNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
        Free Tools
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: position.top, left: position.left }}
              className="fixed z-[100] w-60 overflow-hidden rounded-lg border border-surface-border bg-white py-1.5 shadow-lg"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  buttonRef.current?.focus();
                }
              }}
            >
              {TOOLS.map((tool, index) => (
                <Link
                  key={tool.href}
                  href={`/${locale}/${tool.href}`}
                  onClick={() => setOpen(false)}
                  autoFocus={index === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-tint hover:text-primary"
                >
                  <span aria-hidden>{tool.icon}</span>
                  {tool.label}
                </Link>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
