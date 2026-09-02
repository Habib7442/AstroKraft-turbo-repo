"use client";

import { useMemo, useState } from "react";
import { GemstoneCard, type ProductWithRelations } from "@/components/gemstone-card";
import { SearchBar } from "@/components/search-bar";

interface GemstoneCatalogProps {
  products: ProductWithRelations[];
  locale: string;
}

export function GemstoneCatalog({ products, locale }: GemstoneCatalogProps) {
  const [query, setQuery] = useState("");
  const [searchKey, setSearchKey] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(q) ||
        (product.subtitle ?? "").toLowerCase().includes(q) ||
        (product.categories?.name ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const handleClear = () => {
    setQuery("");
    setSearchKey((k) => k + 1);
  };

  return (
    <div>
      <SearchBar key={searchKey} placeholder="Search gemstones, categories…" onChangeQuery={setQuery} className="mb-8" />

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <GemstoneCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">💎</div>
          <h3 className="font-serif text-lg font-bold text-foreground">No gemstones found</h3>
          <p className="max-w-sm text-sm text-ink-body">
            We couldn&rsquo;t find anything matching &ldquo;{query}&rdquo;. Try a different name or category.
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
