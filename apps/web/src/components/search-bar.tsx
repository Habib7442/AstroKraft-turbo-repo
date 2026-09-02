"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface SearchBarProps {
  placeholder?: string;
  onChangeQuery: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({ placeholder = "Search…", onChangeQuery, debounceMs = 300, className = "" }: SearchBarProps) {
  const [text, setText] = useState("");
  const debounced = useDebouncedValue(text, debounceMs);

  useEffect(() => {
    onChangeQuery(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface-card px-4 py-3 shadow-sm focus-within:border-primary ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-muted">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-ink-muted focus:outline-none"
      />
      {text.length > 0 ? (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label="Clear search"
          className="shrink-0 text-ink-muted transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
