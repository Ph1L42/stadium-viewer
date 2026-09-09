import * as THREE from "three";
import { bowlPoint, facing, onLine } from "../stadium/bowl";
import { VOM_ROWS } from "../stadium/seats";
import type { StadiumParams, Step, AisleLine } from "../stadium/types";
import { M } from "./materials";

/** Rasen, Linien, Tore. */
export function buildPitch(P: StadiumParams, scene: THREE.Scene) {
  const sh = new THREE.Shape();
  for (let k = 0; k <= 240; k++) { const p = bowlPoint(P, k / 240, -1.3); k ? sh.lineTo(p.x, p.z) : sh.moveTo(p.x, p.z); }
  const grass = new THREE.Mesh(new THREE.ShapeGeometry(sh), M("#3c7a22", { side: THREE.DoubleSide }));
  grass.rotation.x = -Math.PI / 2; grass.scale.y = -1; scene.add(grass);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M("#2a2a28"));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.15; scene.add(floor);

  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(P.pitchL / 10, P.pitchW), M(i % 2 ? "#3f8226" : "#377420", { side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(-P.pitchL / 2 + P.pitchL / 20 + i * P.pitchL / 10, 0.01, 0); scene.add(m);
  }
  const lm = new THREE.LineBasicMaterial({ color: "#dfe9d3" });
  const add = (pts: [number, number][]) => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p[0], 0.03, p[1]))), lm));
  const L = P.pitchL / 2, W = P.pitchW / 2;
  add([[-L, -W], [L, -W], [L, W], [-L, W], [-L, -W]]); add([[0, -W], [0, W]]);
  add([[-L, -20.1], [-L + 16.5, -20.1], [-L + 16.5, 20.1], [-L, 20.1]]); add([[L, -20.1], [L - 16.5, -20.1], [L - 16.5, 20.1], [L, 20.1]]);
  add(Array.from({ length: 49 }, (_, i) => [Math.cos(i / 48 * Math.PI * 2) * 9.15, Math.sin(i / 48 * Math.PI * 2) * 9.15] as [number, number]));
  for (const x of [-L, L]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.44, 7.32), M("#ffffff", { roughness: .4 })); g.position.set(x, 1.22, 0); scene.add(g); }
}

/** Gestufte Tribüne als eine Geometrie (Auftritte, Setzstufen, Umläufe). */
export function buildStand(P: StadiumParams, steps: Step[]): THREE.Mesh {
  const K = 360, pos: number[] = [], idx: number[] = [], col: number[] = [];
  const cGrey = new THREE.Color("#c9c7c0"), cWalk = new THREE.Color("#b7b5ae"), cRiser = new THREE.Color("#9b9993");
  const push = (x: number, y: number, z: number, c: THREE.Color) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
  const ring = (off: number, y: number, c: THREE.Color) => Array.from({ length: K + 1 }, (_, k) => { const p = bowlPoint(P, k / K, off); return push(p.x, y, p.z, c); });
  const quads = (A: number[], B: number[]) => { for (let k = 0; k < K; k++) idx.push(A[k]!, B[k]!, A[k + 1]!, A[k + 1]!, B[k]!, B[k + 1]!); };
  quads(ring(0, 0.05, cRiser), ring(0, steps[0]!.y, cRiser));
  steps.forEach((s, i) => {
    const c = s.kind === "row" ? cGrey : cWalk;
    const b = ring(s.off + s.depth, s.y, c); quads(ring(s.off, s.y, c), b);
    const yTop = steps[i + 1]?.y ?? s.y;
    if (yTop > s.y) quads(b, ring(s.off + s.depth, yTop, cRiser));
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, M("#ffffff", { vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
}

function ringShape(P: StadiumParams, offA: number, offB: number) {
  const s = new THREE.Shape(), h = new THREE.Path();
  for (let k = 0; k <= 200; k++) { const p = bowlPoint(P, k / 200, offB); k ? s.lineTo(p.x, p.z) : s.moveTo(p.x, p.z); }
  for (let k = 0; k <= 200; k++) { const p = bowlPoint(P, k / 200, offA); k ? h.lineTo(p.x, p.z) : h.moveTo(p.x, p.z); }
  s.holes.push(h); return s;
}

function wallRing(P: StadiumParams, off: number, y0: number, y1: number, K = 240) {
  const pos: number[] = [], idx: number[] = [];
  for (let k = 0; k <= K; k++) {
    const p = bowlPoint(P, k / K, off); pos.push(p.x, y0, p.z, p.x, y1, p.z);
    if (k < K) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** Außenwand, Dach, Rippen, Flutlichter, Bande. Gibt das Flutlicht-Material zurück (für Nachtmodus). */
export function buildShell(P: StadiumParams, steps: Step[], scene: THREE.Scene): THREE.MeshStandardMaterial {
  const top = steps[steps.length - 1]!, topOff = top.off + 2.5, wallH = top.y + 6;
  scene.add(new THREE.Mesh(wallRing(P, topOff, 0, wallH, 360), M("#5c5c58", { side: THREE.DoubleSide })));
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape(P, topOff - 26, topOff + 2), { depth: 0.8, bevelEnabled: false }), M("#6a6a64", { side: THREE.DoubleSide, roughness: .7 }));
  roof.rotation.x = Math.PI / 2; roof.position.y = wallH + 3; scene.add(roof);

  const d = new THREE.Object3D();
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1.6, 28), M("#4b4b47"), 64);
  for (let i = 0; i < 64; i++) { const p = bowlPoint(P, i / 64, topOff - 12); d.position.set(p.x, wallH + 2.2, p.z); d.rotation.set(0, facing(P, i / 64, topOff - 12), 0); d.updateMatrix(); ribs.setMatrixAt(i, d.matrix); }
  scene.add(ribs);

  const flM = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.4 });
  const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 10, 8), flM, 96);
  for (let i = 0; i < 96; i++) { const p = bowlPoint(P, i / 96, topOff - 24); d.position.set(p.x, wallH + 2.3, p.z); d.rotation.set(0, 0, 0); d.updateMatrix(); fl.setMatrixAt(i, d.matrix); }
  scene.add(fl);

  const band = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape(P, -1.2, -0.9), { depth: 0.9, bevelEnabled: false }), M("#d9dde3", { emissive: "#8fb4d9", emissiveIntensity: 0.15, side: THREE.DoubleSide }));
  band.rotation.x = Math.PI / 2; band.position.y = 0.9; scene.add(band);
  return flM;
}

/** Geländer entlang einer Rangkante. */
export function buildRail(P: StadiumParams, scene: THREE.Scene, off: number, y: number, h: number) {
  const pts = Array.from({ length: 241 }, (_, k) => { const p = bowlPoint(P, k / 240, off); return new THREE.Vector3(p.x, y + h, p.z); });
  const mat = M("#2d3a52", { metalness: .4, roughness: .5 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.05, 5, true), mat));
  const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, h, 5), mat, 180), d = new THREE.Object3D();
  for (let i = 0; i < 180; i++) { const p = bowlPoint(P, i / 180, off); d.position.set(p.x, y + h / 2, p.z); d.updateMatrix(); post.setMatrixAt(i, d.matrix); }
  scene.add(post);
}

/** Treppen: zwei Halbstufen pro Reihe und Handlauf, entlang der Treppenlinien. */
export function buildStairs(P: StadiumParams, steps: Step[], aisles: AisleLine[][], scene: THREE.Scene) {
  const rows = steps.filter(s => s.kind === "row");
  const maxLines = Math.max(...aisles.map(a => a.length));
  const st = new THREE.InstancedMesh(new THREE.BoxGeometry(P.aisleWidth - 0.15, 0.2, P.rowDepth / 2), M("#dad8d0", { roughness: .9 }), rows.length * maxLines * 2);
  const rl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.9, P.rowDepth + 0.02), M("#3a4a63", { metalness: .5, roughness: .4 }), rows.length * maxLines);
  const d = new THREE.Object3D(); let k = 0, j = 0;
  for (const s of rows) for (const l of aisles[s.tier] ?? []) {
    const h = P.rowDepth * s.tan;
    [0.25, 0.75].forEach((f, q) => { const p = onLine(l, s.off + f * P.rowDepth); d.position.set(p.x, s.y + (q ? h * 0.75 : h * 0.25), p.z); d.rotation.set(0, l.rot, 0); d.updateMatrix(); st.setMatrixAt(k++, d.matrix); });
    const p = onLine(l, s.off + P.rowDepth / 2); d.position.set(p.x, s.y + h / 2 + 0.45, p.z); d.rotation.set(0, l.rot, 0); d.updateMatrix(); rl.setMatrixAt(j++, d.matrix);
  }
  st.count = k; rl.count = j; scene.add(st, rl);
}

/** Logenring auf dem Logen-Umlauf: Glasfront, dunkler Innenraum, Trennwände, Sturz. */
export function buildBoxes(P: StadiumParams, steps: Step[], scene: THREE.Scene) {
  for (const s of steps.filter(s => s.logen)) {
    const off = s.off + 1.6, h = 2.9;
    scene.add(new THREE.Mesh(wallRing(P, off, s.y + 0.05, s.y + h), new THREE.MeshStandardMaterial({ color: "#1a2636", emissive: "#26384f", emissiveIntensity: .35, metalness: .7, roughness: .15, transparent: true, opacity: .88, side: THREE.DoubleSide })));
    scene.add(new THREE.Mesh(wallRing(P, off + 2.2, s.y, s.y + h), M("#0d1117", { side: THREE.DoubleSide })));
    const d = new THREE.Object3D();
    const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, h, 2.6), M("#d5d3cc"), 72);
    for (let i = 0; i < 72; i++) { const p = bowlPoint(P, i / 72, off + 1.1); d.position.set(p.x, s.y + h / 2, p.z); d.rotation.set(0, facing(P, i / 72, off + 1.1), 0); d.updateMatrix(); wall.setMatrixAt(i, d.matrix); }
    const lin = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.35, 2.8), M("#8a8a84"), 240);
    for (let i = 0; i < 240; i++) { const p = bowlPoint(P, i / 240, off + 1.1); d.position.set(p.x, s.y + h + 0.18, p.z); d.rotation.set(0, facing(P, i / 240, off + 1.1), 0); d.updateMatrix(); lin.setMatrixAt(i, d.matrix); }
    scene.add(wall, lin);
    buildRail(P, scene, s.off + 0.15, s.y, 1.05);
  }
}

/** Mundlöcher: dunkle Öffnung bündig in der Tribüne, Brüstung an drei Seiten. */
export function buildVomitoria(P: StadiumParams, steps: Step[], vomLines: number[], scene: THREE.Scene) {
  const s = steps.find(x => x.kind === "row" && x.tier === 0 && x.row === VOM_ROWS.from)!;
  const s2 = steps.find(x => x.kind === "row" && x.tier === 0 && x.row === VOM_ROWS.to)!;
  const depth = s2.off + 0.8 - s.off, hole = new THREE.BoxGeometry(4.6, 0.25, depth), holeM = M("#0b0c0e"), par = M("#dedcd5");
  for (const v of vomLines) {
    const mid = (s.off + s2.off + 0.8) / 2, c = bowlPoint(P, v, mid);
    const grp = new THREE.Group(); grp.position.set(c.x, (s.y + s2.y) / 2, c.z); grp.rotation.y = facing(P, v, mid);
    const hm = new THREE.Mesh(hole, holeM); hm.position.y = 0.05; grp.add(hm);
    for (const [x, z, w, hh, dd] of [[-2.35, 0, 0.08, 1, depth], [2.35, 0, 0.08, 1, depth], [0, -depth / 2, 4.7, 1, 0.08]] as const) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, dd), par); m.position.set(x, 0.5, z); grp.add(m);
    }
    scene.add(grp);
  }
}
