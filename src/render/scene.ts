import * as THREE from "three";

export interface Lighting { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; spots: THREE.SpotLight[]; floodMat?: THREE.MeshStandardMaterial }

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function createLighting(scene: THREE.Scene): Lighting {
  const hemi = new THREE.HemisphereLight("#cfdcea", "#3a3a36", 1.0), sun = new THREE.DirectionalLight("#fff3d8", 1.4);
  sun.position.set(90, 160, 70); scene.add(hemi, sun);
  const spots = ([[80, 0], [-80, 0], [0, 90], [0, -90]] as const).map(([x, z]) => {
    const s = new THREE.SpotLight("#eef3ff", 0, 400, 0.7, 0.6, 1); s.position.set(x * 1.3, 58, z * 1.3); scene.add(s, s.target); return s;
  });
  return { hemi, sun, spots };
}

export function setNight(scene: THREE.Scene, renderer: THREE.WebGLRenderer, L: Lighting, night: boolean) {
  const bg = new THREE.Color(night ? "#0b0d14" : "#a9c0d8");
  scene.background = bg; scene.fog = new THREE.Fog(bg, night ? 180 : 260, night ? 420 : 520);
  L.hemi.intensity = night ? 0.35 : 1.0; L.sun.intensity = night ? 0 : 1.4;
  L.spots.forEach(s => s.intensity = night ? 2.2 : 0);
  if (L.floodMat) L.floodMat.emissiveIntensity = night ? 6 : 0.4;
  renderer.toneMappingExposure = night ? 1.0 : 1.05;
}
