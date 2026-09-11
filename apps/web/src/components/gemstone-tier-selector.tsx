"use client";

import { useState } from "react";
import type { Product } from "@astrokraft/db";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { inferCartCategory } from "@/lib/cart-category";
import type { ProductVariantRow } from "@/components/gemstone-card";

const TIER_LABELS: Record<string, string> = {
  basic: "Basic",
  semi_prem: "Semi-Prem",
  premium: "Premium"
};

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

interface GemstoneTierSelectorProps {
  product: Product;
  tiers: ProductVariantRow[];
  categoryName?: string;
}

export function GemstoneTierSelector({ product, tiers, categoryName }: GemstoneTierSelectorProps) {
  const cheapest = tiers.slice().sort((a, b) => a.price - b.price)[0];
  const [selectedId, setSelectedId] = useState(cheapest?.id);
  const selected = tiers.find((t) => t.id === selectedId) ?? cheapest;

  const handleSelect = (e: React.MouseEvent, tierId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(tierId);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {tiers.map((tier) => {
          const isSelected = tier.id === selected?.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={(e) => handleSelect(e, tier.id)}
              className={`rounded-md border px-1.5 py-0.5 text-left transition-colors ${
                isSelected ? "border-primary bg-primary/10" : "border-surface-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="block text-[8px] font-bold uppercase tracking-wide text-ink-muted">
                {TIER_LABELS[tier.quality as string] ?? tier.quality}
              </span>
              {tier.original_price && tier.original_price > tier.price ? (
                <span className="block text-[8px] text-ink-muted line-through">{formatPrice(tier.original_price)}</span>
              ) : null}
              <span className="block text-[10.5px] font-bold text-gold">{formatPrice(tier.price)}</span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <AddToCartButton
          compact
          item={{
            id: selected.id,
            productId: product.id,
            variantId: selected.id,
            title: product.title,
            subtitle: product.subtitle,
            price: selected.price,
            originalPrice: selected.original_price ?? undefined,
            imageUrl: product.images?.[0],
            category: inferCartCategory(categoryName)
          }}
        />
      ) : null}
    </>
  );
}
