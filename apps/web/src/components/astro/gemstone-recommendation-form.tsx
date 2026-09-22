"use client";

import { useState } from "react";
import Link from "next/link";
import { PlacePicker, type PlaceValue } from "@/components/astro/place-picker";
import { GEMSTONES } from "@/lib/astro/gemstones";
import { SIGNS, type PlanetId } from "@/lib/astro/core";
import type { GemstoneProductLink } from "@/lib/astro/gemstone-product";

interface GemstoneRecommendationFormProps {
  locale: string;
  gemstoneMap: Record<string, GemstoneProductLink>;
}

interface ApiResult {
  ascendant: { signName: string };
  planets: { id: PlanetId; signName: string }[];
}

function rulerOf(signName: string): PlanetId {
  const sign = SIGNS.find((s) => s.name === signName);
  return (sign?.ruler ?? "Sun") as PlanetId;
}

export function GemstoneRecommendationForm({ locale, gemstoneMap }: GemstoneRecommendationFormProps) {
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  const canSubmit = dob.length === 10 && time.length === 5 && !!place;

  const handleSubmit = async () => {
    if (!canSubmit || !place) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob, time, place: place.place, latitude: place.latitude, longitude: place.longitude })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not compute your recommendation.");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not compute your recommendation.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const moon = result.planets.find((p) => p.id === "Moon");
    const primaryPlanet = rulerOf(result.ascendant.signName);
    const secondaryPlanet = moon ? rulerOf(moon.signName) : primaryPlanet;
    const primary = GEMSTONES[primaryPlanet];
    const secondary = secondaryPlanet !== primaryPlanet ? GEMSTONES[secondaryPlanet] : null;

    return (
      <div className="flex flex-col gap-5">
        {[
          { gem: primary, label: "Primary Gemstone", reasonPrefix: `Your ascendant is ${result.ascendant.signName}, ruled by ${primaryPlanet}.` },
          ...(secondary
            ? [{ gem: secondary, label: "Secondary Gemstone", reasonPrefix: `Your Moon sign is ${moon?.signName}, ruled by ${secondaryPlanet}.` }]
            : [])
        ].map(({ gem, label, reasonPrefix }) => {
          const product = gemstoneMap[gem.planet];
          return (
            <div key={gem.planet} className="rounded-2xl border border-surface-border bg-surface-card p-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{label}</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-foreground">
                {gem.name} <span className="text-base font-normal text-ink-muted">({gem.sanskritName})</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-body">
                {reasonPrefix} This stone is worn to {gem.reason}. Traditionally set in {gem.metal}, worn on the{" "}
                {gem.finger}, first worn on a {gem.day}.
              </p>
              {product ? (
                <Link
                  href={`/${locale}/products/${product.slug}`}
                  className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold/90"
                >
                  Shop {gem.name} →
                </Link>
              ) : null}
            </div>
          );
        })}

        <div className="rounded-2xl border border-surface-border bg-surface-tint/40 p-5 text-center">
          <p className="text-xs text-ink-body">
            This is general guidance from your chart, not a full compatibility check — some stones (especially Blue
            Sapphire) can act strongly and don&rsquo;t suit everyone. We recommend confirming with an astrologer
            before wearing one.
          </p>
          <Link
            href={`/${locale}/consultation`}
            className="mt-3 inline-block rounded-full border border-primary px-6 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Book a Consultation
          </Link>
        </div>

        <button type="button" onClick={() => setResult(null)} className="mx-auto text-xs font-semibold text-primary hover:underline">
          ← Try different birth details
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-6">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Time of Birth</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Place of Birth</label>
          <PlacePicker value={place} onChange={setPlace} />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="mt-1 w-full rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Get My Personal Recommendation"}
        </button>
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
