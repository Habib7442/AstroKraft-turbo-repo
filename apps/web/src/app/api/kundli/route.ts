import { NextRequest, NextResponse } from "next/server";
import { kundliInputSchema } from "@astrokraft/validators";
import { computeChart, SIGNS } from "@/lib/astro/core";

// India-only tool (see kundliInputSchema's lat/lon bounds), so every
// birthplace is treated as Asia/Kolkata (IST, UTC+5:30) - India has used a
// single, non-DST offset nationwide since 1947, so this is exact for any
// birth date the form will realistically see, not an approximation.
const IST_OFFSET_MINUTES = 5.5 * 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = kundliInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid birth details." }, { status: 400 });
  }

  const { name, dob, time, place, latitude, longitude } = parsed.data;
  const [year, month, day] = dob.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const birthUtc = new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);

  const chart = computeChart(birthUtc, latitude, longitude);

  return NextResponse.json({
    name: name || null,
    dob,
    time,
    place,
    ascendant: { ...chart.ascendant, signName: SIGNS[chart.ascendant.signIndex].name },
    planets: chart.planets.map((p) => ({ ...p, signName: SIGNS[p.signIndex].name })),
    dasha: chart.dasha,
    ayanamsa: chart.ayanamsa
  });
}
