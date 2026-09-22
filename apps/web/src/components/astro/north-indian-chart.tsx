import type { PlanetId } from "@/lib/astro/core";

interface ChartPlanet {
  id: PlanetId;
  house: number;
  retrograde: boolean;
}

interface NorthIndianChartProps {
  ascendantSignIndex: number; // 0-11, Aries=0
  planets: ChartPlanet[];
}

const PLANET_ABBR: Record<PlanetId, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

// Fixed screen coordinates for a North Indian (diamond-style) birth chart:
// house position never moves, only which sign/planets occupy it. Derived by
// hand from the standard construction - outer square, both corner-to-corner
// diagonals, and an inner diamond connecting the four side-midpoints - then
// solving every pairwise line intersection to get exact vertices, not eyeballed.
// Verified: houses 1/4/7/10 land on the four diamonds (top/left/bottom/right,
// matching the well-known convention that the 4th house sits on the left and
// the 10th on the right), and the numbering runs counter-clockwise from the
// top, which is the standard direction.
const A = [0, 0], B = [400, 0], C = [400, 400], D = [0, 400];
const Mtop = [200, 0], Mright = [400, 200], Mbottom = [200, 400], Mleft = [0, 200];
const O = [200, 200];
const P1 = [300, 100], P2 = [100, 100], P3 = [300, 300], P4 = [100, 300];

const HOUSE_POLYGONS: Record<number, number[][]> = {
  1: [Mtop, P1, O, P2],
  2: [A, Mtop, P2],
  3: [A, Mleft, P2],
  4: [Mleft, P2, O, P4],
  5: [D, Mleft, P4],
  6: [D, Mbottom, P4],
  7: [Mbottom, P4, O, P3],
  8: [Mbottom, C, P3],
  9: [C, Mright, P3],
  10: [Mright, P3, O, P1],
  11: [B, Mright, P1],
  12: [B, Mtop, P1]
};

function centroid(points: number[][]): [number, number] {
  const n = points.length;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

export function NorthIndianChart({ ascendantSignIndex, planets }: NorthIndianChartProps) {
  const byHouse = new Map<number, ChartPlanet[]>();
  for (const p of planets) {
    const list = byHouse.get(p.house) ?? [];
    list.push(p);
    byHouse.set(p.house, list);
  }

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Vedic birth chart (North Indian style)">
      <rect x={0} y={0} width={400} height={400} fill="white" stroke="#5B21B6" strokeWidth={2} />
      <line x1={0} y1={0} x2={400} y2={400} stroke="#5B21B6" strokeWidth={1.5} />
      <line x1={400} y1={0} x2={0} y2={400} stroke="#5B21B6" strokeWidth={1.5} />
      <polygon
        points={`${Mtop.join(",")} ${Mright.join(",")} ${Mbottom.join(",")} ${Mleft.join(",")}`}
        fill="none"
        stroke="#5B21B6"
        strokeWidth={1.5}
      />

      {Object.entries(HOUSE_POLYGONS).map(([houseStr, poly]) => {
        const house = Number(houseStr);
        const signNumber = ((ascendantSignIndex + house - 1) % 12) + 1;
        const [cx, cy] = centroid(poly);
        const occupants = byHouse.get(house) ?? [];
        return (
          <g key={house}>
            <text x={cx} y={cy - (occupants.length > 0 ? 10 : 0)} textAnchor="middle" fontSize={13} fontWeight={700} fill="#B8860B">
              {signNumber}
            </text>
            {occupants.map((p, i) => (
              <text
                key={p.id}
                x={cx}
                y={cy + 6 + i * 13}
                textAnchor="middle"
                fontSize={12}
                fill="#221A3D"
              >
                {PLANET_ABBR[p.id]}
                {p.retrograde ? "ᴿ" : ""}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
