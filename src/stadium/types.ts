/** Blockaufteilung eines Rangs: Längsseiten (n/s), Torseiten (e/w), Keilblöcke je Ecke (c). */
export interface BlockLayout { n: number; s: number; e: number; w: number; c: number }

export interface Tier {
  rows: number;
  /** Umlauf vor dem Rang in Metern (0 beim untersten Rang) */
  gap: number;
  /** Höhensprung des Umlaufs in Metern */
  rise: number;
  /** Steigung in Grad */
  rake: number;
  blocks: BlockLayout;
  /** Kleinste Blocknummer des Rangs, z. B. 101 / 201 / 301. */
  blockFirst: number;
  /**
   * Wo die Nummerierung ansetzt. Von dort laufen die Nummern gegen den Umlaufsinn
   * der Kurve — im Blockplan also nach links.
   * "corner" = Ecke Nordseite/Ostkurve, "center" = Mitte der Nordseite.
   */
  blockAnchor: "corner" | "center";
  logen?: boolean;
}

/**
 * Stehplatzbereich: zusammenhängende Blöcke einer Torseite, in denen die Sitze
 * hochgeklappt sind und die Leute dichter stehen. Modellachsen: n/s sind die
 * Längsseiten, die Kurven hinter den Toren liegen auf e/w.
 */
export interface StandingSector {
  name: string;
  tier: number;
  /** Blocknummern von…bis einschließlich, wie im Blockplan */
  blocks: [number, number];
  /** Platzabstand entlang der Reihe; enger als seatPitch */
  pitch: number;
}

export interface StadiumParams {
  name: string;
  pitchL: number;
  pitchW: number;
  /** Abstand Spielfeldrand → erste Reihe */
  margin: number;
  /** Eckradius der ersten Reihe */
  corner: number;
  seatPitch: number;
  rowDepth: number;
  aisleWidth: number;
  tiers: Tier[];
  standing?: StandingSector[];
}

export type StepKind = "row" | "walk";
export interface Step {
  kind: StepKind;
  tier: number;
  /** horizontaler Abstand zur ersten Reihe */
  off: number;
  y: number;
  depth: number;
  row: number;
  tan: number;
  logen: boolean;
}

export interface Seat {
  x: number; y: number; z: number;
  /** Position entlang der Reihenkurve, 0 = Mitte Nordseite */
  u: number;
  row: number;
  tier: number;
  /** Blickrichtung als rotation.y */
  rot: number;
  north: boolean;
  /** Blocknummer laut Blockplan */
  block: number;
  /** Platzabstand entlang der Reihe an dieser Stelle */
  pitch: number;
  /** Stehplatz statt Sitzplatz */
  standing: boolean;
}

export interface AisleLine {
  x: number; z: number;
  off0: number;
  /** Richtung nach außen */
  dx: number; dz: number;
  rot: number;
}
