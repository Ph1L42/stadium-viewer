import * as THREE from "three";
import type { Seat } from "../stadium/types";
import type { SeatMeshes } from "../render/seats";

export interface Paper { name: string; hex: string }
export const PAPER: Paper[] = [
  { name: "Grün", hex: "#0F6E56" }, { name: "Creme", hex: "#FAEEDA" }, { name: "Rot", hex: "#D85A30" },
  { name: "Schwarz", hex: "#1a1a19" }, { name: "Weiß", hex: "#f6f6f2" },
];

/** Zustand der Choreo: Papierfarbe je Sitz (-1 = keins), Beteiligung, Sitzfarbe. */
export class Choreo {
  readonly paint: Int8Array;
  private readonly rnd: Float32Array;
  readonly paperCol = PAPER.map(p => new THREE.Color(p.hex));
  seatBase = new THREE.Color("#c8322c");
  participation = 0.86;
  private tmp = new THREE.Color();

  constructor(readonly seats: Seat[], readonly meshes: SeatMeshes) {
    this.paint = new Int8Array(seats.length).fill(-1);
    this.rnd = new Float32Array(seats.length).map(() => Math.random());
  }

  private seatColor(i: number) {
    const s = this.seats[i]!; this.tmp.copy(this.seatBase);
    this.tmp.multiplyScalar(0.72 + 0.28 * Math.min(1, s.row / 12) + (s.tier === 2 ? 0.06 : 0));
    if (s.tier === 1 && s.row < 3) this.tmp.lerp(new THREE.Color("#e8e6df"), 0.85);
    return this.tmp;
  }
  refresh(i: number) {
    this.meshes.setSeatColor(i, this.seatColor(i));
    const p = this.paint[i]!, show = p >= 0 && this.rnd[i]! < this.participation;
    this.meshes.setPaper(i, show ? this.paperCol[p]! : null);
  }
  refreshAll() { for (let i = 0; i < this.seats.length; i++) this.refresh(i); this.meshes.commit(); }

  /** Kugelpinsel um einen Sitz, nur im selben Rang. Radius in Sitzen. */
  brush(center: number, radiusSeats: number, color: number, seatPitch: number) {
    const s = this.seats[center]!, R = radiusSeats * seatPitch * 0.5;
    for (let i = 0; i < this.seats.length; i++) {
      const q = this.seats[i]!; if (q.tier !== s.tier) continue;
      if (Math.hypot(q.x - s.x, q.y - s.y, q.z - s.z) <= R) { this.paint[i] = color; this.refresh(i); }
    }
    this.meshes.commit();
  }
  clear() { this.paint.fill(-1); this.refreshAll(); }

  counts() {
    const cnt = PAPER.map(() => 0); let total = 0;
    for (const p of this.paint) if (p >= 0) { cnt[p]!++; total++; }
    return { cnt, total };
  }

  /** Demo-Motiv über eine flache Abwicklung (u, Reihe) der Nordkurve, Unterrang. */
  loadDemo(rows: number) {
    const cv = document.createElement("canvas"); cv.width = 400; cv.height = 60; const c = cv.getContext("2d")!;
    c.fillStyle = "#0F6E56"; c.fillRect(0, 0, 400, 60); c.fillStyle = "#FAEEDA"; c.fillRect(70, 8, 260, 44);
    c.fillStyle = "#D85A30"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SEIT 1909", 200, 31);
    const img = c.getImageData(0, 0, 400, 60).data;
    this.seats.forEach((s, i) => {
      if (!s.north || s.tier !== 0) return;
      const uu = ((s.u + 0.125) % 1) / 0.25, px = Math.floor(uu * 399), py = Math.floor((1 - s.row / (rows - 1)) * 59), k = (py * 400 + px) * 4;
      this.tmp.setRGB(img[k]! / 255, img[k + 1]! / 255, img[k + 2]! / 255);
      let best = 0, bd = 9;
      this.paperCol.forEach((pc, j) => { const d = Math.hypot(pc.r - this.tmp.r, pc.g - this.tmp.g, pc.b - this.tmp.b); if (d < bd) { bd = d; best = j; } });
      this.paint[i] = best;
    });
    this.refreshAll();
  }
}
