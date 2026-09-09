import type { StadiumParams } from "./types";

/** Generisches Dreirang-Stadion, Proportionen an einem deutschen Erstligastadion orientiert. */
export const arenaNord: StadiumParams = {
  name: "Arena Nord",
  pitchL: 105, pitchW: 68, margin: 7, corner: 13,
  seatPitch: 0.5, rowDepth: 0.8, aisleWidth: 2,
  tiers: [
    { rows: 20, gap: 0,   rise: 0,   rake: 24, blocks: { n: 7,  s: 8, e: 6, w: 6, c: 2 } },
    { rows: 18, gap: 3.5, rise: 1.2, rake: 30, blocks: { n: 14, s: 7, e: 5, w: 5, c: 4 } },
    { rows: 26, gap: 7,   rise: 3.6, rake: 35, blocks: { n: 7,  s: 8, e: 5, w: 5, c: 5 }, logen: true },
  ],
};
