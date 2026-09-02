import type { CartItem } from "@astrokraft/core";

export function inferCartCategory(categoryName?: string | null): CartItem["category"] {
  const normalized = (categoryName ?? "").toLowerCase();
  if (normalized.includes("rudraksha")) return "rudraksha";
  if (normalized.includes("vastu") || normalized.includes("vasthu")) return "vasthu";
  if (normalized.includes("consult")) return "consultation";
  return "gemstone";
}
