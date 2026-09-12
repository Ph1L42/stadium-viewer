import { describe, it, expect } from "vitest";
import { bowlPoint, buildSteps, buildAisleLines, onLine } from "../src/stadium/bowl";
import { buildSeats } from "../src/stadium/seats";
import { kurtLandauerWeg as P, CAPACITY_KURT_LANDAUER_WEG } from "../src/stadium/presets";

describe("bowlPoint", () => {
  it("startet in der Mitte der Nordseite", () => {
    const p = bowlPoint(P, 0, 0);
    expect(p.x).toBeCloseTo(0, 6); expect(p.z).toBeCloseTo(-(P.pitchW / 2 + P.margin), 6);
  });
  it("ist geschlossen und symmetrisch", () => {
    const a = bowlPoint(P, 0.25, 0), b = bowlPoint(P, 0.75, 0);
    expect(a.x).toBeCloseTo(-b.x, 6); expect(a.z).toBeCloseTo(b.z, 6);
    expect(bowlPoint(P, 0.999999, 0).x).toBeCloseTo(bowlPoint(P, 0, 0).x, 3);
  });
  it("Parallelkurve: Abstand zur ersten Reihe entspricht off", () => {
    const inner = bowlPoint(P, 0.5, 0), outer = bowlPoint(P, 0.5, 10);
    expect(Math.hypot(outer.x - inner.x, outer.z - inner.z)).toBeCloseTo(10, 6);
  });
});

describe("Treppenlinien", () => {
  const steps = buildSteps(P), aisles = buildAisleLines(P, steps);
  it("auf der Nordgeraden parallel (Richtung 0,-1), inkl. der beiden Eckkanten", () => {
    const north = aisles[0]!.filter(l => Math.abs(l.dz + 1) < 1e-9 && Math.abs(l.dx) < 1e-9);
    expect(north.length).toBe(P.tiers[0]!.blocks.n + 1);
  });
  it("liegen in jeder Reihe auf der Reihenkurve", () => {
    const l = aisles[0]![0]!, p = onLine(l, 8);
    // Punkt liegt auf der Nordgeraden bei off=8
    expect(p.z).toBeCloseTo(-(P.pitchW / 2 + P.margin + 8), 6);
  });
});

describe("Sitze", () => {
  const steps = buildSteps(P), aisles = buildAisleLines(P, steps), { seats } = buildSeats(P, steps, aisles);
  it("erzeugt eine plausible Anzahl", () => { expect(seats.length).toBeGreaterThan(30000); expect(seats.length).toBeLessThan(80000); });
  it("halten Abstand zu den Treppen", () => {
    const l = aisles[0]![0]!;
    const near = seats.filter(s => s.tier === 0 && Math.abs((s.x - l.x) * l.dz - (s.z - l.z) * l.dx) < P.aisleWidth / 2 - 0.01 && Math.abs(s.z - onLine(l, s.row * P.rowDepth).z) < 1);
    expect(near.length).toBe(0);
  });
});

describe("Kapazität", () => {
  const steps = buildSteps(P), seats = buildSeats(P, steps, buildAisleLines(P, steps)).seats;

  /** Die Platzabstände der Stehbereiche sind auf diese Zahl kalibriert. */
  it("fasst genau die nationale Kapazität", () => {
    expect(seats.length).toBe(CAPACITY_KURT_LANDAUER_WEG);
  });

  it("Stehplätze liegen nur in den Kurven des Unterrangs", () => {
    const steh = seats.filter(s => s.standing);
    expect(steh.length).toBeGreaterThan(0);
    expect(steh.every(s => s.tier === 0)).toBe(true);
    const hx = P.pitchL / 2 + P.margin - P.corner;
    expect(steh.every(s => Math.abs(s.x) > hx)).toBe(true);
  });

  it("Stehplätze stehen dichter als Sitzplätze", () => {
    expect(seats.filter(s => s.standing).every(s => s.pitch < P.seatPitch)).toBe(true);
    expect(seats.filter(s => !s.standing).every(s => s.pitch === P.seatPitch)).toBe(true);
  });
});

describe("Blockplan", () => {
  const steps = buildSteps(P), seats = buildSeats(P, steps, buildAisleLines(P, steps)).seats;
  const blocksOf = (tier: number) => [...new Set(seats.filter(s => s.tier === tier).map(s => s.block))].sort((a, b) => a - b);
  const mid = (block: number) => {
    const g = seats.filter(s => s.block === block);
    return { x: g.reduce((a, s) => a + s.x, 0) / g.length, z: g.reduce((a, s) => a + s.z, 0) / g.length, n: g.length };
  };

  it("hat 36 / 48 / 48 fortlaufende Blöcke je Rang", () => {
    expect(blocksOf(0)).toEqual(Array.from({ length: 36 }, (_, i) => 101 + i));
    expect(blocksOf(1)).toEqual(Array.from({ length: 48 }, (_, i) => 201 + i));
    expect(blocksOf(2)).toEqual(Array.from({ length: 48 }, (_, i) => 301 + i));
  });

  it("nummeriert den Unterrang wie im Plan: 101 rechts außen, 104 mittig, 107 links außen", () => {
    const hx = P.pitchL / 2 + P.margin - P.corner;
    expect(mid(104).x).toBeCloseTo(0, 0);
    expect(mid(101).x).toBeGreaterThan(0);
    expect(mid(107).x).toBeLessThan(0);
    for (const b of [101, 104, 107]) expect(mid(b).z).toBeLessThan(0);      // Nordseite
    for (const b of [112, 117]) expect(mid(b).x).toBeLessThan(-hx);          // Westkurve
    for (const b of [126, 131]) expect(mid(b).x).toBeGreaterThan(hx);        // Ostkurve
    for (const b of [120, 124]) expect(mid(b).z).toBeGreaterThan(0);         // Südseite
  });

  it("setzt 301 und 348 beidseits der Mittellinie — Anker in der Rangmitte", () => {
    expect(mid(301).x).toBeLessThan(0);
    expect(mid(348).x).toBeGreaterThan(0);
    expect(Math.abs(mid(301).x)).toBeCloseTo(Math.abs(mid(348).x), 0);
  });

  it("stellt genau die Kurvenblöcke des Plans als Stehplätze", () => {
    const steh = [...new Set(seats.filter(s => s.standing).map(s => s.block))].sort((a, b) => a - b);
    expect(steh).toEqual([109, 110, 111, 112, 113, 114, 115, 116, 117, 129, 130, 131, 132, 133, 134, 135]);
  });

  it("hält die Blöcke je Rang ähnlich groß", () => {
    for (const tier of [0, 1, 2]) {
      const sizes = blocksOf(tier).filter(b => !seats.some(s => s.block === b && s.standing)).map(b => mid(b).n);
      expect(Math.max(...sizes) / Math.min(...sizes)).toBeLessThan(2.5);
    }
  });
});
