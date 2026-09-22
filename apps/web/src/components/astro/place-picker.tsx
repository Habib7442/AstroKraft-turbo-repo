"use client";

import { useEffect, useRef, useState } from "react";

// [name, state, lat, lon]
type CityRow = [string, string, number, number];

export interface PlaceValue {
  place: string;
  latitude: number;
  longitude: number;
}

interface PlacePickerProps {
  value: PlaceValue | null;
  onChange: (value: PlaceValue | null) => void;
  id?: string;
}

let citiesPromise: Promise<CityRow[]> | null = null;
// /data/in-cities.json (~260KB) is bundled from GeoNames (CC BY 4.0), not
// fetched from a third party - so it works offline and never depends on an
// external geocoding API's uptime or quota. Loaded once, only when a visitor
// actually focuses this field, not on every page that happens to render it.
function loadCities(): Promise<CityRow[]> {
  citiesPromise ??= fetch("/data/in-cities.json")
    .then((r) => r.json())
    .then((data: { cities: CityRow[] }) => data.cities);
  return citiesPromise;
}

export function PlacePicker({ value, onChange, id }: PlacePickerProps) {
  const [query, setQuery] = useState(value?.place ?? "");
  const [cities, setCities] = useState<CityRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = cities && q.length >= 2 ? cities.filter((c) => c[0].toLowerCase().startsWith(q)).slice(0, 8) : [];

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        placeholder="City, e.g. Silchar"
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          if (!cities) void loadCities().then(setCities);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          // A previously selected city's coordinates must not silently keep
          // backing a now-different-looking input - without this, editing
          // the text after picking a city left the old lat/lon selected,
          // so the form would submit (and compute a chart for) whatever
          // city was last clicked, not whatever the input now shows.
          onChange(null);
          setOpen(true);
        }}
        className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {open && q.length >= 2 ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface-card shadow-lg">
          {cities === null ? (
            <p className="px-4 py-3 text-xs text-ink-muted">Loading cities…</p>
          ) : matches.length === 0 ? (
            <p className="px-4 py-3 text-xs text-ink-muted">No matching Indian city found.</p>
          ) : (
            matches.map((c) => (
              <button
                key={`${c[0]}-${c[1]}-${c[2]}-${c[3]}`}
                type="button"
                onClick={() => {
                  const place = c[1] ? `${c[0]}, ${c[1]}` : c[0];
                  setQuery(place);
                  setOpen(false);
                  onChange({ place, latitude: c[2], longitude: c[3] });
                }}
                className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-tint"
              >
                {c[0]}
                {c[1] ? <span className="text-ink-muted"> — {c[1]}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
