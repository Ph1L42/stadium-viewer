import * as THREE from "three";
import type { Seat } from "../stadium/types";
import { M } from "./materials";

/** Sitzschale als L-Profil, Blickrichtung lokal -z. */
function seatGeometry() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.42, 0); sh.lineTo(0, 0); sh.lineTo(0, 0.44); sh.lineTo(-0.07, 0.46); sh.lineTo(-0.07, 0.07); sh.lineTo(-0.42, 0.07); sh.lineTo(-0.42, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
  g.rotateY(-Math.PI / 2); g.translate(0.21, 0, 0);
  return g;
}

/** Instanzierte Sitze plus instanzierte Papierblätter (unsichtbar = Skalierung 0). */
export class SeatMeshes {
  readonly seatMesh: THREE.InstancedMesh;
  readonly paperMesh: THREE.InstancedMesh;
  private readonly paperMat: THREE.Matrix4[];
  private readonly hidden = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(readonly seats: Seat[]) {
    const N = seats.length, d = new THREE.Object3D();
    this.seatMesh = new THREE.InstancedMesh(seatGeometry(), M("#ffffff", { roughness: .55, metalness: .05 }), N);
    this.paperMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.46, 0.62), M("#ffffff", { side: THREE.DoubleSide, roughness: .9 }), N);
    this.seatMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.paperMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.paperMat = seats.map((s, i) => {
      d.position.set(s.x, s.y, s.z); d.rotation.set(0, s.rot, 0); d.updateMatrix(); this.seatMesh.setMatrixAt(i, d.matrix);
      d.position.set(s.x, s.y + 0.55, s.z); d.rotateX(-0.35); d.updateMatrix(); return d.matrix.clone();
    });
  }

  setSeatColor(i: number, c: THREE.Color) { this.seatMesh.setColorAt(i, c); }
  setPaper(i: number, color: THREE.Color | null) {
    this.paperMesh.setMatrixAt(i, color ? this.paperMat[i]! : this.hidden);
    if (color) this.paperMesh.setColorAt(i, color);
  }
  commit() {
    this.seatMesh.instanceColor!.needsUpdate = true;
    this.paperMesh.instanceMatrix.needsUpdate = true;
    this.paperMesh.instanceColor!.needsUpdate = true;
  }
}
