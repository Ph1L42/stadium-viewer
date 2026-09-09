import { describe, it, expect } from "vitest";
import { bowlPoint, buildSteps, buildAisleLines, onLine } from "../src/stadium/bowl";
import { buildSeats } from "../src/stadium/seats";
import { arenaNord as P } from "../src/stadium/presets";

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
