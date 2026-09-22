import type { PlanetId } from "@/lib/astro/core";

export interface GemstoneInfo {
  planet: PlanetId;
  name: string;
  sanskritName: string;
  /** Lowercase keywords matched against a live product's title - no hardcoded slug/ID, so this
   *  self-heals if the catalog changes instead of ever linking to a deleted/renamed product. */
  keywords: string[];
  metal: string;
  finger: string;
  day: string;
  reason: string;
}

// The traditional Navaratna assignment (one gemstone per graha). Rahu/Ketu
// use their standard substitutes (Hessonite/Cat's Eye) since neither has a
// classical "own" stone.
export const GEMSTONES: Record<PlanetId, GemstoneInfo> = {
  Sun: {
    planet: "Sun",
    name: "Ruby",
    sanskritName: "Manik",
    keywords: ["ruby"],
    metal: "gold or copper",
    finger: "ring finger",
    day: "Sunday morning",
    reason: "strengthens confidence, leadership and vitality"
  },
  Moon: {
    planet: "Moon",
    name: "Pearl",
    sanskritName: "Moti",
    keywords: ["pearl"],
    metal: "silver",
    finger: "little finger",
    day: "Monday morning",
    reason: "calms the mind and supports emotional balance"
  },
  Mars: {
    planet: "Mars",
    name: "Red Coral",
    sanskritName: "Moonga",
    keywords: ["red coral", "coral"],
    metal: "gold or copper",
    finger: "ring finger",
    day: "Tuesday morning",
    reason: "builds courage, drive and physical energy"
  },
  Mercury: {
    planet: "Mercury",
    name: "Emerald",
    sanskritName: "Panna",
    keywords: ["emerald"],
    metal: "gold",
    finger: "little finger",
    day: "Wednesday morning",
    reason: "sharpens communication, intellect and business sense"
  },
  Jupiter: {
    planet: "Jupiter",
    name: "Yellow Sapphire",
    sanskritName: "Pukhraj",
    keywords: ["yellow sapphire"],
    metal: "gold",
    finger: "index finger",
    day: "Thursday morning",
    reason: "supports wisdom, finances and good fortune"
  },
  Venus: {
    planet: "Venus",
    name: "Diamond",
    sanskritName: "Heera",
    keywords: ["diamond"],
    metal: "silver or platinum",
    finger: "middle finger",
    day: "Friday morning",
    reason: "enhances love, beauty and luxury in life"
  },
  Saturn: {
    planet: "Saturn",
    name: "Blue Sapphire",
    sanskritName: "Neelam",
    keywords: ["blue sapphire"],
    metal: "silver",
    finger: "middle finger",
    day: "Saturday morning",
    reason: "brings discipline and long-term stability — its effects are fast and strong, so always trial it or consult an astrologer first"
  },
  Rahu: {
    planet: "Rahu",
    name: "Hessonite",
    sanskritName: "Gomed",
    keywords: ["gomed", "hessonite"],
    metal: "silver",
    finger: "middle finger",
    day: "Saturday evening",
    reason: "helps steady sudden change and restlessness"
  },
  Ketu: {
    planet: "Ketu",
    name: "Cat's Eye",
    sanskritName: "Lehsunia",
    keywords: ["cat's eye", "cat s eye", "chrysoberyl", "lehsunia"],
    metal: "silver",
    finger: "middle finger",
    day: "Tuesday evening",
    reason: "guards against confusion and hidden obstacles"
  }
};
