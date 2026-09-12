import * as THREE from "three";
import { STADIUMS, DEFAULT_STADIUM } from "./stadium/presets";
import { buildSteps, buildAisleLines } from "./stadium/bowl";
import { buildSeats } from "./stadium/seats";
import { buildPitch, buildStand, buildShell, buildStairs, buildBoxes, buildVomitoria, buildRail } from "./render/stadium";
import { SeatMeshes } from "./render/seats";
import { OrbitCamera, PRESETS } from "./render/camera";
import { createRenderer, createLighting, setNight } from "./render/scene";
import { Choreo } from "./paint/paint";
import { mountUi, renderStats } from "./ui/ui";

const P = STADIUMS[DEFAULT_STADIUM];
const steps = buildSteps(P), aisles = buildAisleLines(P, steps), { seats, vomLines } = buildSeats(P, steps, aisles);

const renderer = createRenderer(); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(), lighting = createLighting(scene);
buildPitch(P, scene); scene.add(buildStand(P, steps));
lighting.floodMat = buildShell(P, steps, scene);
buildStairs(P, steps, aisles, scene); buildBoxes(P, steps, scene); buildVomitoria(P, steps, vomLines, scene);
steps.filter(s => s.kind === "row" && s.row === 0).forEach(s => buildRail(P, scene, s.off + 0.05, s.y, 1.0));

const meshes = new SeatMeshes(seats); scene.add(meshes.seatMesh, meshes.paperMesh);
const choreo = new Choreo(seats, meshes);
const cam = new OrbitCamera(innerWidth / innerHeight);

// ---- Interaktion
let mode: "paint" | "orbit" = "paint", color = 0, brush = 6, dragging = false, dragBtn = 0, altHeld = false, last = { x: 0, y: 0 };
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), el = renderer.domElement;
el.addEventListener("contextmenu", e => e.preventDefault());
addEventListener("keydown", e => { if (e.key === "Alt") { altHeld = true; e.preventDefault(); } });
addEventListener("keyup", e => { if (e.key === "Alt") altHeld = false; });

function paintAt(ev: PointerEvent) {
  mouse.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, cam.camera);
  const hit = ray.intersectObject(meshes.seatMesh)[0];
  if (hit?.instanceId === undefined) return;
  choreo.brush(hit.instanceId, brush, color, P.seatPitch); renderStats(choreo);
}
el.addEventListener("pointerdown", ev => { dragging = true; dragBtn = ev.button; last = { x: ev.clientX, y: ev.clientY }; el.setPointerCapture(ev.pointerId); if (mode === "paint" && !altHeld && ev.button === 0) paintAt(ev); });
el.addEventListener("pointermove", ev => {
  if (!dragging) return;
  if (!(mode === "orbit" || altHeld || dragBtn !== 0)) { paintAt(ev); return; }
  const dx = ev.clientX - last.x, dy = ev.clientY - last.y; last = { x: ev.clientX, y: ev.clientY };
  dragBtn === 2 ? cam.pan(dx, dy) : cam.rotate(dx, dy);
});
el.addEventListener("pointerup", () => dragging = false);
el.addEventListener("wheel", ev => cam.zoom(ev.deltaY), { passive: true });
addEventListener("resize", () => { cam.camera.aspect = innerWidth / innerHeight; cam.camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

mountUi({
  onMode: m => mode = m,
  onCamera: key => cam.goTo(PRESETS[key]!),
  onColor: i => color = i,
  onSeatColor: hex => { choreo.seatBase.set(hex); choreo.refreshAll(); },
  onParticipation: v => { choreo.participation = v; choreo.refreshAll(); renderStats(choreo); },
  onBrush: v => brush = v,
  onNight: n => setNight(scene, renderer, lighting, n),
  onClear: () => { choreo.clear(); renderStats(choreo); },
  onDemo: () => { choreo.loadDemo(P.tiers[0]!.rows); renderStats(choreo); },
});

setNight(scene, renderer, lighting, false);
cam.jumpTo(PRESETS.frei!); cam.goTo(PRESETS.tv!);
choreo.loadDemo(P.tiers[0]!.rows); renderStats(choreo);

renderer.setAnimationLoop(now => { cam.update(now); renderer.render(scene, cam.camera); });
