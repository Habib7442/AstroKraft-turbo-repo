"use client";

import { useState } from "react";
import { formatINR, useCartStore } from "@astrokraft/core";
import type { Product, ProductVariant } from "@astrokraft/db";
import { inferCartCategory } from "@/lib/cart-category";

const TIER_LABELS: Record<string, string> = {
  basic: "Basic",
  semi_prem: "Semi-Premium",
  premium: "Premium"
};

interface TierSelectorProps {
  variants: ProductVariant[];
  product: Product & { categories: { name: string } | null };
}

export function TierSelector({ variants, product }: TierSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return <p className="text-sm text-ink-muted">This product is currently unavailable.</p>;
  }

  const handleAdd = () => {
    addItem({
      id: selected.id,
      productId: product.id,
      variantId: selected.id,
      title: `${product.title} — ${TIER_LABELS[selected.quality ?? ""] ?? selected.title}`,
      subtitle: product.subtitle,
      price: selected.price,
      originalPrice: selected.original_price,
      imageUrl: product.images?.[0],
      category: inferCartCategory(product.categories?.name),
      quantity
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {variants.map((variant) => {
          const isActive = variant.id === selected.id;
          const label = TIER_LABELS[variant.quality ?? ""] ?? variant.title;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedId(variant.id)}
              className={`flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-surface-border bg-surface-card hover:border-primary/40"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
              <span className="text-base font-bold text-gold">{formatINR(variant.price)}</span>
              {variant.original_price && variant.original_price > variant.price ? (
                <span className="text-xs text-ink-muted line-through">{formatINR(variant.original_price)}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected.carat_weight || selected.origin || selected.sku ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-xs text-ink-body">
          {selected.carat_weight ? (
            <span>
              <span className="font-semibold text-foreground">Weight:</span> {selected.carat_weight} Ratti
            </span>
          ) : null}
          {selected.origin ? (
            <span>
              <span className="font-semibold text-foreground">Origin:</span> {selected.origin}
            </span>
          ) : null}
          {selected.sku ? (
            <span>
              <span className="font-semibold text-foreground">SKU:</span> {selected.sku}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg text-ink-body hover:text-primary"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 text-lg text-ink-body hover:text-primary">
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={selected.stock <= 0}
          className={`flex-1 rounded-md py-3 text-sm font-semibold text-white transition-colors ${
            selected.stock <= 0
              ? "cursor-not-allowed bg-surface-border text-ink-muted"
              : added
                ? "bg-green-600"
                : "bg-primary hover:bg-primary/90"
          }`}
        >
          {selected.stock <= 0 ? "Out of Stock" : added ? "Added to Cart ✓" : `Add to Cart · ${formatINR(selected.price * quantity)}`}
        </button>
      </div>
    </div>
  );
}
