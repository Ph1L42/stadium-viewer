import * as THREE from "three";

export const M = (color: THREE.ColorRepresentation, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
