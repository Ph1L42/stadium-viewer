import type { StadiumParams } from "./types";

/**
 * Nachbau der Allianz Arena: 105×68-Spielfeld, drei Ränge mit Logenring
 * zwischen Mittel- und Oberrang, steiler 34°-Oberrang, rund 258×227 m Grundfläche.
 */
export const kurtLandauerWeg: StadiumParams = {
  name: "Stadion am Kurt Landauer Weg",
  pitchL: 105, pitchW: 68, margin: 8, corner: 22,
  seatPitch: 0.5, rowDepth: 0.8, aisleWidth: 2,
  // Blockaufteilung nach dem Blockplan der Allianz Arena: 36 / 48 / 48 Blöcke.
  // Eine Kurve umfasst die Torseite plus die beiden angrenzenden Keilgruppen (2*c + e bzw. 2*c + w),
  // im Unterrang also 108–118 links (2*4 + 3) und 126–136 rechts (2*4 + 3).
  // Die Geraden bleiben bei wachsendem Umlauf gleich lang, der Zuwachs steckt in den Eckbögen —
  // die oberen Ränge brauchen daher deutlich mehr Keil- als Geradenblöcke, damit alle
  // Blöcke wie im Plan etwa gleich groß bleiben.
  tiers: [
    { rows: 30, gap: 0, rise: 0, rake: 25, blocks: { n: 7,  s: 7,  e: 3, w: 3, c: 4 }, blockFirst: 101, blockAnchor: "corner" },
    { rows: 26, gap: 3, rise: 2, rake: 31, blocks: { n: 10, s: 7,  e: 4, w: 3, c: 6 }, blockFirst: 201, blockAnchor: "corner" },
    { rows: 17, gap: 6, rise: 5, rake: 34, blocks: { n: 6,  s: 6,  e: 2, w: 2, c: 8 }, blockFirst: 301, blockAnchor: "center", logen: true },
  ],
  // Die Kurven im Unterrang sind Stehplätze; erst damit kommt die Arena auf ihre
  // nationale Kapazität. Die Platzabstände sind auf CAPACITY kalibriert — siehe Test.
  standing: [
    { name: "Südkurve", tier: 0, blocks: [109, 117], pitch: 0.327 },
    { name: "Nordkurve", tier: 0, blocks: [129, 135], pitch: 0.327 },
  ],
};

/** Nationale Kapazität inklusive Stehplätze. */
export const CAPACITY_KURT_LANDAUER_WEG = 75024;

/** Alle verfügbaren Stadien; Schlüssel dient als ID für Auswahl und Persistenz. */
export const STADIUMS = {
  kurtLandauerWeg,
} satisfies Record<string, StadiumParams>;

export type StadiumId = keyof typeof STADIUMS;

export const DEFAULT_STADIUM: StadiumId = "kurtLandauerWeg";
