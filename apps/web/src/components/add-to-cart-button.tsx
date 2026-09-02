"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@astrokraft/core";

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity">;
  quantity?: number;
  compact?: boolean;
}

export function AddToCartButton({ item, quantity = 1, compact }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    addItem({ ...item, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`flex items-center justify-center gap-1.5 rounded-md font-semibold text-white transition-colors ${
        compact ? "w-full py-2 text-xs" : "flex-1 py-3 text-sm"
      } ${added ? "bg-green-600" : "bg-primary hover:bg-primary/90"}`}
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
