"use client";

import { useEffect } from "react";
import { useCartStore } from "@astrokraft/core";

/**
 * The cart store uses `skipHydration: true` so server-rendered HTML always
 * starts from an empty cart (avoiding a hydration mismatch against whatever
 * was in localStorage). This component triggers the real rehydration once,
 * after mount, on the client only.
 */
export function CartHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
