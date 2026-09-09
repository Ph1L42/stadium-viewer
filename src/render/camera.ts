import * as THREE from "three";

export interface CamPreset { theta: number; phi: number; r: number; target: [number, number, number] }

export const PRESETS: Record<string, CamPreset & { label: string }> = {
  tv:    { label: "TV-Kamera",     theta: Math.PI,        phi: 1.2,  r: 125, target: [0, 10, -42] },
  gegen: { label: "Gegengerade",   theta: Math.PI,        phi: 1.45, r: 98,  target: [0, 12, -46] },
  tor:   { label: "Hintertor",     theta: Math.PI / 2,    phi: 1.35, r: 150, target: [0, 8, -20] },
  sitz:  { label: "Aus dem Block", theta: Math.PI * 0.62, phi: 1.42, r: 60,  target: [20, 10, -40] },
  oben:  { label: "Von oben",      theta: Math.PI,        phi: 0.02, r: 330, target: [0, 0, 0] },
  frei:  { label: "Frei",          theta: Math.PI * 0.72, phi: 0.78, r: 250, target: [0, 0, 0] },
};

const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Kleine Orbit-Kamera mit weichen Fahrten zwischen Presets. */
export class OrbitCamera {
  readonly camera: THREE.PerspectiveCamera;
  readonly target = new THREE.Vector3(0, 6, -30);
  theta = Math.PI; phi = 1.15; r = 120;
  private goal = { theta: 0, phi: 0, r: 0, target: new THREE.Vector3() };
  private from = { theta: 0, phi: 0, r: 0, target: new THREE.Vector3() };
  private t = 1; private start: number | null = null;

  constructor(aspect: number) { this.camera = new THREE.PerspectiveCamera(38, aspect, 0.3, 900); }

  goTo(p: CamPreset) { this.goal = { theta: p.theta, phi: p.phi, r: p.r, target: new THREE.Vector3(...p.target) }; this.t = 0; }
  jumpTo(p: CamPreset) { this.theta = p.theta; this.phi = p.phi; this.r = p.r; this.target.set(...p.target); }
  /** Nutzerinteraktion bricht eine laufende Fahrt ab. */
  interrupt() { this.t = 1; }
  rotate(dx: number, dy: number) { this.interrupt(); this.theta -= dx * 0.006; this.phi = Math.min(1.52, Math.max(0.02, this.phi - dy * 0.006)); }
  pan(dx: number, dy: number) {
    this.interrupt();
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0), up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    this.target.addScaledVector(right, -dx * this.r * 0.0012).addScaledVector(up, dy * this.r * 0.0012);
  }
  zoom(delta: number) { this.interrupt(); this.r = Math.min(450, Math.max(8, this.r * (1 + delta * 0.001))); }

  update(now: number) {
    if (this.t < 1) {
      if (this.start === null) { this.start = now; this.from = { theta: this.theta, phi: this.phi, r: this.r, target: this.target.clone() }; }
      this.t = Math.min(1, (now - this.start) / 1100); const k = ease(this.t);
      this.theta = this.from.theta + (this.goal.theta - this.from.theta) * k;
      this.phi = this.from.phi + (this.goal.phi - this.from.phi) * k;
      this.r = this.from.r + (this.goal.r - this.from.r) * k;
      this.target.lerpVectors(this.from.target, this.goal.target, k);
      if (this.t >= 1) this.start = null;
    } else this.start = null;
    this.camera.position.set(
      this.target.x + this.r * Math.sin(this.phi) * Math.sin(this.theta),
      this.target.y + this.r * Math.cos(this.phi),
      this.target.z + this.r * Math.sin(this.phi) * Math.cos(this.theta));
    this.camera.lookAt(this.target);
  }
}
