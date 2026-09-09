import { bowlPoint, facing, onLine } from "./bowl";
import type { StadiumParams, Step, AisleLine, Seat } from "./types";

export interface SeatLayout {
  seats: Seat[];
  /** u-Positionen der Mundlöcher (Unterrang) */
  vomLines: number[];
}

/** Reihen, in denen das Mundloch liegt (Unterrang). */
export const VOM_ROWS = { from: 6, to: 10 } as const;

/**
 * Sitze blockweise setzen: jeder Block beginnt an seiner Treppenkante,
 * die Sitze stehen dadurch auf den Geraden in festen Spalten.
 */
export function buildSeats(P: StadiumParams, steps: Step[], aisles: AisleLine[][]): SeatLayout {
  const seats: Seat[] = [];
  const vomLines: number[] = [];
  const S = 2400;

  for (const s of steps) {
    if (s.kind !== "row") continue;
    const offS = s.off + 0.42, per = bowlPoint(P, 0, offS).per;
    const pts = Array.from({ length: S }, (_, k) => bowlPoint(P, k / S, offS));
    const cuts = (aisles[s.tier] ?? [])
      .map(l => {
        const t = onLine(l, offS);
        let best = 0, bd = Infinity;
        for (let k = 0; k < S; k++) {
          const p = pts[k]!, d = (p.x - t.x) ** 2 + (p.z - t.z) ** 2;
          if (d < bd) { bd = d; best = k; }
        }
        return best / S;
      })
      .sort((a, b) => a - b);

    if (s.row === 0 && s.tier === 0) {
      for (let i = 0; i < cuts.length; i++) {
        const next = cuts[(i + 1) % cuts.length]! + (i + 1 === cuts.length ? 1 : 0);
        if (i % 3 === 1) vomLines.push(((cuts[i]! + next) / 2) % 1);
      }
    }

    for (let i = 0; i < cuts.length; i++) {
      const ua = cuts[i]!, ub = cuts[(i + 1) % cuts.length]! + (i + 1 === cuts.length ? 1 : 0);
      const sEnd = ub * per - P.aisleWidth / 2 - P.seatPitch / 2;
      for (let sPos = ua * per + P.aisleWidth / 2 + P.seatPitch / 2; sPos <= sEnd; sPos += P.seatPitch) {
        const u = (sPos / per) % 1, p = bowlPoint(P, u, offS);
        if (s.tier === 0 && s.row >= VOM_ROWS.from && s.row <= VOM_ROWS.to &&
            vomLines.some(v => { const d = Math.abs(u - v); return Math.min(d, 1 - d) * per < 2.4; })) continue;
        seats.push({ x: p.x, y: s.y, z: p.z, u, row: s.row, tier: s.tier, rot: facing(P, u, offS), north: u < 0.125 || u > 0.875 });
      }
    }
  }
  return { seats, vomLines };
}
