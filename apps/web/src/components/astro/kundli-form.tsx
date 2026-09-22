"use client";

import { useState } from "react";
import Link from "next/link";
import { NorthIndianChart } from "@/components/astro/north-indian-chart";
import { PlacePicker, type PlaceValue } from "@/components/astro/place-picker";
import { GEMSTONES } from "@/lib/astro/gemstones";
import type { GemstoneProductLink } from "@/lib/astro/gemstone-product";
import type { PlanetId } from "@/lib/astro/core";

interface KundliPlanet {
  id: PlanetId;
  signName: string;
  degreeInSign: number;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

interface KundliResult {
  ascendant: { signIndex: number; signName: string; degreeInSign: number; nakshatra: string; pada: number };
  planets: KundliPlanet[];
  dasha: { lord: PlanetId; start: string; end: string }[];
}

interface KundliFormProps {
  locale: string;
  gemstoneMap: Record<string, GemstoneProductLink>;
}

function degMinString(deg: number) {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

export function KundliForm({ locale, gemstoneMap }: KundliFormProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KundliResult | null>(null);

  const canSubmit = dob.length === 10 && time.length === 5 && !!place;

  const handleSubmit = async () => {
    if (!canSubmit || !place) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/kundli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, dob, time, place: place.place, latitude: place.latitude, longitude: place.longitude })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate your kundli.");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not generate your kundli.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const moon = result.planets.find((p) => p.id === "Moon");
    const currentDasha = result.dasha.find((d) => new Date(d.start) <= new Date() && new Date() < new Date(d.end));
    const gem = moon ? gemstoneMap[GEMSTONES[moon.id]?.planet] : undefined;

    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-surface-border bg-surface-card p-6 sm:flex-row sm:items-start">
          <div className="w-full max-w-[280px] shrink-0">
            <NorthIndianChart ascendantSignIndex={result.ascendant.signIndex} planets={result.planets} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-foreground">
              {name ? `${name}'s ` : "Your "}Birth Chart
            </h3>
            <p className="mt-1 text-sm text-ink-body">
              Born {dob} at {time}, {place?.place}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Lagna (Ascendant)</dt>
                <dd className="font-semibold text-foreground">{result.ascendant.signName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Moon Sign (Rashi)</dt>
                <dd className="font-semibold text-foreground">{moon?.signName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Birth Nakshatra</dt>
                <dd className="font-semibold text-foreground">
                  {moon?.nakshatra} (Pada {moon?.pada})
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Current Dasha</dt>
                <dd className="font-semibold text-foreground">{currentDasha?.lord}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface-card p-4">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <th className="py-2">Planet</th>
                <th className="py-2">Sign</th>
                <th className="py-2">Degree</th>
                <th className="py-2">House</th>
                <th className="py-2">Nakshatra</th>
              </tr>
            </thead>
            <tbody>
              {result.planets.map((p) => (
                <tr key={p.id} className="border-b border-surface-border/60 last:border-0">
                  <td className="py-2 font-semibold text-foreground">
                    {p.id}
                    {p.retrograde ? <span className="ml-1 text-xs text-destructive">(R)</span> : null}
                  </td>
                  <td className="py-2 text-ink-body">{p.signName}</td>
                  <td className="py-2 text-ink-body">{degMinString(p.degreeInSign)}</td>
                  <td className="py-2 text-ink-body">{p.house}</td>
                  <td className="py-2 text-ink-body">
                    {p.nakshatra} ({p.pada})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card p-5">
          <h3 className="font-serif text-base font-bold text-foreground">Vimshottari Dasha Timeline</h3>
          <div className="mt-3 flex flex-col gap-2">
            {result.dasha.map((d) => (
              <div
                key={d.lord + d.start}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  d === currentDasha ? "bg-primary/10 font-semibold text-primary" : "text-ink-body"
                }`}
              >
                <span>{d.lord} Mahadasha</span>
                <span>
                  {new Date(d.start).getFullYear()} – {new Date(d.end).getFullYear()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="font-serif text-lg font-bold text-foreground">Want the Full Picture?</h3>
          <p className="mt-2 text-sm text-ink-body">
            This free chart shows your placements — a personal consultation covers what they actually mean for your
            career, relationships and health, plus remedies specific to your chart.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/consultation`}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Book a Consultation
            </Link>
            {gem ? (
              <Link
                href={`/${locale}/products/${gem.slug}`}
                className="rounded-full border border-primary px-6 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Shop Your Moon-Sign Gemstone →
              </Link>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setResult(null)}
          className="mx-auto text-xs font-semibold text-primary hover:underline"
        >
          ← Generate another kundli
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">
            Your Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
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
          <p className="mt-1 text-[11px] text-ink-muted">Currently supports Indian birthplaces only.</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Generate My Free Kundli"}
        </button>
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
