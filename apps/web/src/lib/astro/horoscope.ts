import { SIGNS, siderealLongitude, skySnapshot, signIndex, nextMoonSignChange, type SignId } from "@/lib/astro/core";
import { HOUSE_READINGS, SIGN_OPENERS, NAKSHATRA_THEMES, WEEKDAYS } from "@/lib/astro/horoscope-content";

export interface DailyHoroscope {
  signId: SignId;
  signName: string;
  date: string; // YYYY-MM-DD, IST calendar date this reading is for
  moonHouseFromSign: number; // 1-12, transiting Moon's house counted from this sign
  moonSignName: string;
  nakshatra: string;
  tithi: string;
  scores: { overall: number; love: number; career: number; health: number };
  opener: string;
  general: string;
  love: string;
  career: string;
  health: string;
  luckyColour: string;
  luckyNumber: number;
  moonChangesAt: string | null; // ISO instant the Moon leaves the current sign, if within 48h
}

const IST_OFFSET_MS = 5.5 * 3600_000;

// "Today" for a horoscope is the IST calendar date, evaluated at IST noon so
// this is stable across the whole day rather than flipping near the runtime
// clock's own midnight if the server isn't in IST.
export function istDateKey(at = new Date()): string {
  const ist = new Date(at.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

function pick<T>(pair: [T, T], dateKey: string, signId: string): T {
  // Deterministic per (date, sign) so the same reading shows to every
  // visitor and every ISR regeneration on a given day, not a different one
  // each time - "random" here means "varies by day and sign", not "varies
  // per request".
  let h = 0;
  for (const ch of dateKey + signId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pair[h % 2];
}

export function getDailyHoroscope(signId: SignId, at = new Date()): DailyHoroscope {
  const signIdx = SIGNS.findIndex((s) => s.id === signId);
  const dateKey = istDateKey(at);
  // Evaluate at IST noon on the target date so the reading reflects that
  // whole day's dominant transit rather than a specific instant.
  const [y, m, d] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 6, 30)); // 12:00 IST = 06:30 UTC

  const moonLon = siderealLongitude("Moon", noonUtc);
  const moonSign = signIndex(moonLon);
  const houseFromSign = ((moonSign - signIdx + 12) % 12) + 1;
  const reading = HOUSE_READINGS[houseFromSign];
  const sky = skySnapshot(noonUtc);
  const weekday = WEEKDAYS[noonUtc.getUTCDay()];
  const change = nextMoonSignChange(noonUtc, 48);

  return {
    signId,
    signName: SIGNS[signIdx].name,
    date: dateKey,
    moonHouseFromSign: houseFromSign,
    moonSignName: SIGNS[moonSign].name,
    nakshatra: sky.nakshatra,
    tithi: `${sky.tithiName} (${sky.paksha} Paksha)`,
    scores: reading.scores,
    opener: SIGN_OPENERS[signIdx],
    general: pick(reading.general, dateKey, signId),
    love: pick(reading.love, dateKey, signId),
    career: pick(reading.career, dateKey, signId),
    health: pick(reading.health, dateKey, signId),
    luckyColour: weekday.colour,
    luckyNumber: weekday.number,
    moonChangesAt: change ? change.at.toISOString() : null
  };
}

export { NAKSHATRA_THEMES };
