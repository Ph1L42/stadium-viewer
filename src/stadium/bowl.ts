import type { StadiumParams, Step, AisleLine } from "./types";

export interface BowlPoint { x: number; z: number; per: number }

/**
 * Geschlossene Stadionkurve als Parallelkurve eines abgerundeten Rechtecks.
 * t in [0,1), Nullpunkt = Mitte der Nordseite (z negativ), Umlauf im Uhrzeigersinn.
 * off = Abstand zur ersten Reihe; die Eckmittelpunkte bleiben fest, der Radius wächst mit off.
 */
export function bowlPoint(P: StadiumParams, t: number, off: number): BowlPoint {
  const a = P.pitchL / 2 + P.margin + off, b = P.pitchW / 2 + P.margin + off, r = P.corner + off;
  const sx = 2 * (a - r), sz = 2 * (b - r), arc = Math.PI * r / 2, per = 2 * sx + 2 * sz + 4 * arc;
  const q = Math.PI / 2;
  const seg: { len: number; f: (u: number) => [number, number] }[] = [
    { len: sx / 2, f: u => [u * sx / 2, -b] },
    { len: arc, f: u => [(a - r) + Math.cos(-q + u * q) * r, -(b - r) + Math.sin(-q + u * q) * r] },
    { len: sz, f: u => [a, -(b - r) + u * sz] },
    { len: arc, f: u => [(a - r) + Math.cos(u * q) * r, (b - r) + Math.sin(u * q) * r] },
    { len: sx, f: u => [(a - r) - u * sx, b] },
    { len: arc, f: u => [-(a - r) + Math.cos(q + u * q) * r, (b - r) + Math.sin(q + u * q) * r] },
    { len: sz, f: u => [-a, (b - r) - u * sz] },
    { len: arc, f: u => [-(a - r) + Math.cos(Math.PI + u * q) * r, -(b - r) + Math.sin(Math.PI + u * q) * r] },
    { len: sx / 2, f: u => [-(a - r) + u * sx / 2, -b] },
  ];
  let s = (((t % 1) + 1) % 1) * per;
  for (const g of seg) {
    if (s <= g.len) { const [x, z] = g.f(s / g.len); return { x, z, per }; }
    s -= g.len;
  }
  return { x: 0, z: -b, per };
}

/** Blickrichtung senkrecht zur Reihenkurve nach innen, als rotation.y. */
export function facing(P: StadiumParams, u: number, off: number): number {
  const a = bowlPoint(P, u, off), b = bowlPoint(P, u + 0.0015, off);
  const tx = b.x - a.x, tz = b.z - a.z;
  return Math.atan2(tz, -tx);
}

/** u-Position, ab der die Blocknummern eines Rangs hochgezählt werden. */
export function blockAnchorU(P: StadiumParams, off: number, anchor: "corner" | "center"): number {
  if (anchor === "center") return 0;
  const a = P.pitchL / 2 + P.margin + off, r = P.corner + off;
  return (a - r) / bowlPoint(P, 0, off).per;
}

/**
 * Blocknummern eines Rangs: vom Anker aus gegen den Umlaufsinn durchnummeriert,
 * genau wie im Blockplan. mids sind die u-Mitten der Blöcke in Umlaufreihenfolge.
 */
export function blockNumbers(mids: number[], first: number, anchorU: number): number[] {
  const key = mids.map(u => (((anchorU - u) % 1) + 1) % 1);
  const order = [...key.keys()].sort((a, b) => key[a]! - key[b]!);
  const num = new Array<number>(mids.length);
  order.forEach((idx, rank) => { num[idx] = first + rank; });
  return num;
}

/** Stufenprofil des gesamten Rangs, von der ersten Reihe bis zum oberen Umlauf. */
export function buildSteps(P: StadiumParams): Step[] {
  const steps: Step[] = [];
  let off = 0, y = 0.9;
  P.tiers.forEach((t, ti) => {
    if (ti > 0) {
      steps.push({ kind: "walk", tier: ti, off, y, depth: t.gap, row: -1, tan: 0, logen: !!t.logen });
      off += t.gap; y += t.rise;
    }
    const tan = Math.tan(t.rake * Math.PI / 180);
    for (let r = 0; r < t.rows; r++) {
      steps.push({ kind: "row", tier: ti, off, y, depth: P.rowDepth, row: r, tan, logen: false });
      off += P.rowDepth; y += P.rowDepth * tan;
    }
  });
  steps.push({ kind: "walk", tier: 99, off, y, depth: 2.5, row: -1, tan: 0, logen: false });
  return steps;
}

/**
 * Treppenlinien je Rang: auf den Geraden parallel und senkrecht zur Reihe,
 * in den Ecken radial vom festen Eckmittelpunkt.
 */
export function buildAisleLines(P: StadiumParams, steps: Step[]): AisleLine[][] {
  const a0 = P.pitchL / 2 + P.margin, b0 = P.pitchW / 2 + P.margin, r0 = P.corner, hx = a0 - r0, hz = b0 - r0;
  return P.tiers.map((t, ti) => {
    const first = steps.find(s => s.kind === "row" && s.tier === ti)!;
    const o = first.off, B = t.blocks, lines: AisleLine[] = [];
    const add = (x: number, z: number, dx: number, dz: number) => lines.push({ x, z, off0: o, dx, dz, rot: Math.atan2(dx, dz) });
    for (let k = 1; k < B.n; k++) add(-hx + k * 2 * hx / B.n, -(b0 + o), 0, -1);
    for (let k = 1; k < B.s; k++) add(-hx + k * 2 * hx / B.s, (b0 + o), 0, 1);
    for (let k = 1; k < B.e; k++) add((a0 + o), -hz + k * 2 * hz / B.e, 1, 0);
    for (let k = 1; k < B.w; k++) add(-(a0 + o), -hz + k * 2 * hz / B.w, -1, 0);
    for (const [sx, sz] of [[1, -1], [1, 1], [-1, 1], [-1, -1]] as const) {
      for (let k = 0; k <= B.c; k++) {
        const th = k / B.c * Math.PI / 2, dx = sx * Math.cos(th), dz = sz * Math.sin(th);
        add(sx * hx + dx * (r0 + o), sz * hz + dz * (r0 + o), dx, dz);
      }
    }
    return lines;
  });
}

export const onLine = (l: AisleLine, off: number) => ({ x: l.x + l.dx * (off - l.off0), z: l.z + l.dz * (off - l.off0) });
