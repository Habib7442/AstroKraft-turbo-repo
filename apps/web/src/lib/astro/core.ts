import * as Astronomy from "astronomy-engine";

// Vedic (sidereal, Lahiri) chart maths on top of astronomy-engine (MIT).
// Deliberately NOT Swiss Ephemeris: it is AGPL (or a paid commercial licence),
// which for a closed-source commercial site would mean publishing this whole
// site's source. astronomy-engine is accurate to about an arcminute for the
// planets, which is far finer than a consumer kundli needs. Rahu/Ketu use the
// mean node, the convention most printed panchangs follow.

export const SIGNS = [
  { id: "aries", name: "Aries", sanskrit: "Mesha", ruler: "Mars", element: "Fire", symbol: "♈" },
  { id: "taurus", name: "Taurus", sanskrit: "Vrishabha", ruler: "Venus", element: "Earth", symbol: "♉" },
  { id: "gemini", name: "Gemini", sanskrit: "Mithuna", ruler: "Mercury", element: "Air", symbol: "♊" },
  { id: "cancer", name: "Cancer", sanskrit: "Karka", ruler: "Moon", element: "Water", symbol: "♋" },
  { id: "leo", name: "Leo", sanskrit: "Simha", ruler: "Sun", element: "Fire", symbol: "♌" },
  { id: "virgo", name: "Virgo", sanskrit: "Kanya", ruler: "Mercury", element: "Earth", symbol: "♍" },
  { id: "libra", name: "Libra", sanskrit: "Tula", ruler: "Venus", element: "Air", symbol: "♎" },
  { id: "scorpio", name: "Scorpio", sanskrit: "Vrishchika", ruler: "Mars", element: "Water", symbol: "♏" },
  { id: "sagittarius", name: "Sagittarius", sanskrit: "Dhanu", ruler: "Jupiter", element: "Fire", symbol: "♐" },
  { id: "capricorn", name: "Capricorn", sanskrit: "Makara", ruler: "Saturn", element: "Earth", symbol: "♑" },
  { id: "aquarius", name: "Aquarius", sanskrit: "Kumbha", ruler: "Saturn", element: "Air", symbol: "♒" },
  { id: "pisces", name: "Pisces", sanskrit: "Meena", ruler: "Jupiter", element: "Water", symbol: "♓" }
] as const;

export type SignId = (typeof SIGNS)[number]["id"];
export type PlanetId = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

export const PLANET_ORDER: PlanetId[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
] as const;

const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
  "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"
];

const DEG = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;
const NAK_SPAN = 360 / 27;

export const julianDay = (date: Date) => date.getTime() / 86400000 + 2440587.5;

// Lahiri (Chitrapaksha) ayanamsa: ~23°51'11" at J2000, growing with general
// precession. Checked against the Mesha Sankranti (Sun at sidereal 0° Aries)
// timing in the accompanying test.
export function lahiriAyanamsa(date: Date): number {
  const T = (julianDay(date) - 2451545.0) / 36525;
  return 23.8531 + (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

const BODIES: Record<Exclude<PlanetId, "Sun" | "Moon" | "Rahu" | "Ketu">, Astronomy.Body> = {
  Mars: Astronomy.Body.Mars,
  Mercury: Astronomy.Body.Mercury,
  Jupiter: Astronomy.Body.Jupiter,
  Venus: Astronomy.Body.Venus,
  Saturn: Astronomy.Body.Saturn
};

// Tropical (true ecliptic of date) longitude in degrees.
function tropicalLongitude(id: PlanetId, date: Date): number {
  switch (id) {
    case "Sun":
      return Astronomy.SunPosition(date).elon;
    case "Moon":
      return Astronomy.Ecliptic(Astronomy.GeoMoon(date)).elon;
    case "Rahu":
    case "Ketu": {
      const T = (julianDay(date) - 2451545.0) / 36525;
      const omega = norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
      return id === "Rahu" ? omega : norm360(omega + 180);
    }
    default:
      return Astronomy.Ecliptic(Astronomy.GeoVector(BODIES[id], date, true)).elon;
  }
}

export function siderealLongitude(id: PlanetId, date: Date): number {
  return norm360(tropicalLongitude(id, date) - lahiriAyanamsa(date));
}

function isRetrograde(id: PlanetId, date: Date): boolean {
  if (id === "Rahu" || id === "Ketu") return true;
  if (id === "Sun" || id === "Moon") return false;
  const before = tropicalLongitude(id, new Date(date.getTime() - 12 * 3600_000));
  const after = tropicalLongitude(id, new Date(date.getTime() + 12 * 3600_000));
  const diff = ((after - before + 540) % 360) - 180;
  return diff < 0;
}

// Tropical ascendant (Lagna) for a birth moment and place.
export function tropicalAscendant(date: Date, latitude: number, longitude: number): number {
  const lst = norm360(Astronomy.SiderealTime(date) * 15 + longitude);
  const T = (julianDay(date) - 2451545.0) / 36525;
  const eps = (23.439291 - 0.0130042 * T) * DEG;
  const ramc = lst * DEG;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(latitude * DEG) * Math.sin(eps)));
  return norm360(asc / DEG);
}

export const signIndex = (lon: number) => Math.floor(norm360(lon) / 30);
export const nakshatraIndex = (lon: number) => Math.floor(norm360(lon) / NAK_SPAN);
export const nakshatraPada = (lon: number) => Math.floor((norm360(lon) % NAK_SPAN) / (NAK_SPAN / 4)) + 1;

export interface PlanetPosition {
  id: PlanetId;
  longitude: number;
  signIndex: number;
  degreeInSign: number;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

const DASHA_ORDER: PlanetId[] = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};
const YEAR_MS = 365.25 * 86400_000;

export interface DashaPeriod {
  lord: PlanetId;
  start: string;
  end: string;
}

// Vimshottari maha-dasha timeline from the Moon's nakshatra at birth.
export function vimshottariDasha(moonLongitude: number, birth: Date): DashaPeriod[] {
  const nak = nakshatraIndex(moonLongitude);
  const elapsed = (norm360(moonLongitude) % NAK_SPAN) / NAK_SPAN;
  const startLordIdx = nak % 9;

  const periods: DashaPeriod[] = [];
  let cursor = birth.getTime();
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startLordIdx + i) % 9];
    const years = i === 0 ? DASHA_YEARS[lord] * (1 - elapsed) : DASHA_YEARS[lord];
    const end = cursor + years * YEAR_MS;
    periods.push({ lord, start: new Date(cursor).toISOString(), end: new Date(end).toISOString() });
    cursor = end;
  }
  return periods;
}

export interface Chart {
  ascendant: { longitude: number; signIndex: number; degreeInSign: number; nakshatra: string; pada: number };
  planets: PlanetPosition[];
  ayanamsa: number;
  dasha: DashaPeriod[];
  panchang: SkySnapshot;
}

export function computeChart(birthUtc: Date, latitude: number, longitude: number): Chart {
  const ayanamsa = lahiriAyanamsa(birthUtc);
  const ascLon = norm360(tropicalAscendant(birthUtc, latitude, longitude) - ayanamsa);
  const lagnaSign = signIndex(ascLon);

  const planets: PlanetPosition[] = PLANET_ORDER.map((id) => {
    const lon = siderealLongitude(id, birthUtc);
    const sign = signIndex(lon);
    return {
      id,
      longitude: lon,
      signIndex: sign,
      degreeInSign: lon % 30,
      house: ((sign - lagnaSign + 12) % 12) + 1,
      nakshatra: NAKSHATRAS[nakshatraIndex(lon)],
      pada: nakshatraPada(lon),
      retrograde: isRetrograde(id, birthUtc)
    };
  });

  const moon = planets.find((p) => p.id === "Moon")!;

  return {
    ascendant: {
      longitude: ascLon,
      signIndex: lagnaSign,
      degreeInSign: ascLon % 30,
      nakshatra: NAKSHATRAS[nakshatraIndex(ascLon)],
      pada: nakshatraPada(ascLon)
    },
    planets,
    ayanamsa,
    dasha: vimshottariDasha(moon.longitude, birthUtc),
    panchang: skySnapshot(birthUtc)
  };
}

export interface SkySnapshot {
  sunSignIndex: number;
  moonSignIndex: number;
  moonDegreeInSign: number;
  nakshatra: string;
  pada: number;
  tithiNumber: number;
  tithiName: string;
  paksha: "Shukla" | "Krishna";
}

// Sun/Moon based "sky of the moment" - the raw material for daily readings
// and the panchang-style facts shown on each horoscope page.
export function skySnapshot(date: Date): SkySnapshot {
  const sun = siderealLongitude("Sun", date);
  const moon = siderealLongitude("Moon", date);
  const elongation = norm360(moon - sun);
  const tithiIdx = Math.floor(elongation / 12); // 0..29
  const paksha = tithiIdx < 15 ? "Shukla" : "Krishna";
  const inPaksha = tithiIdx % 15;
  const tithiName = inPaksha === 14 ? (paksha === "Shukla" ? "Purnima" : "Amavasya") : TITHI_NAMES[inPaksha];

  return {
    sunSignIndex: signIndex(sun),
    moonSignIndex: signIndex(moon),
    moonDegreeInSign: moon % 30,
    nakshatra: NAKSHATRAS[nakshatraIndex(moon)],
    pada: nakshatraPada(moon),
    tithiNumber: inPaksha + 1,
    tithiName,
    paksha
  };
}

// First moment after `from` (within `hours`) that the Moon enters a new sign,
// found by stepping then bisecting. Null if it stays in one sign the whole way.
export function nextMoonSignChange(from: Date, hours = 24): { at: Date; signIndex: number } | null {
  const startSign = signIndex(siderealLongitude("Moon", from));
  const STEP = 20 * 60_000;
  let lo = from.getTime();
  for (let t = lo + STEP; t <= from.getTime() + hours * 3600_000; t += STEP) {
    if (signIndex(siderealLongitude("Moon", new Date(t))) !== startSign) {
      let hi = t;
      while (hi - lo > 30_000) {
        const mid = (lo + hi) / 2;
        if (signIndex(siderealLongitude("Moon", new Date(mid))) === startSign) lo = mid;
        else hi = mid;
      }
      return { at: new Date(hi), signIndex: (startSign + 1) % 12 };
    }
    lo = t;
  }
  return null;
}
