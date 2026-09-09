import { PAPER, type Choreo } from "../paint/paint";
import { PRESETS } from "../render/camera";

export const SEAT_COLORS = [{ name: "Rot", hex: "#c8322c" }, { name: "Blau", hex: "#2f5f9e" }, { name: "Grün", hex: "#2e7d4a" }, { name: "Grau", hex: "#8b8a84" }];

export interface UiHandlers {
  onMode(m: "paint" | "orbit"): void;
  onCamera(key: string): void;
  onColor(index: number): void;          // -1 = radieren
  onSeatColor(hex: string): void;
  onParticipation(v: number): void;
  onBrush(v: number): void;
  onNight(night: boolean): void;
  onClear(): void;
  onDemo(): void;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const swatch = (hex: string, label: string, on: boolean) => {
  const b = document.createElement("button"); b.className = "sw" + (on ? " on" : ""); b.style.background = hex; b.title = label; b.setAttribute("aria-label", label); return b;
};
const select = (group: HTMLElement, el: HTMLElement, cls = ".sw") => { group.querySelectorAll(cls).forEach(x => x.classList.remove("on")); el.classList.add("on"); };

export function mountUi(h: UiHandlers) {
  const tools = $("tools");
  PAPER.forEach((p, i) => { const b = swatch(p.hex, p.name, i === 0); b.onclick = () => { select(tools, b); h.onColor(i); }; tools.appendChild(b); });
  tools.insertAdjacentHTML("beforeend", "<hr>");
  const erase = swatch("#6b6b66", "Radieren", false); erase.textContent = "×"; erase.onclick = () => { select(tools, erase); h.onColor(-1); }; tools.appendChild(erase);

  const sc = $("seatCols");
  SEAT_COLORS.forEach((p, i) => { const b = swatch(p.hex, "Sitzfarbe " + p.name, i === 0); b.onclick = () => { select(sc, b); h.onSeatColor(p.hex); }; sc.appendChild(b); });

  const cams = $("cams");
  Object.entries(PRESETS).forEach(([key, p], i) => {
    const b = document.createElement("button"); b.textContent = p.label; if (i === 0) b.classList.add("on");
    b.onclick = () => { select(cams, b, "button"); h.onCamera(key); }; cams.appendChild(b);
  });

  const mp = $("mPaint"), mo = $("mOrbit");
  mp.onclick = () => { mp.classList.add("on"); mo.classList.remove("on"); h.onMode("paint"); };
  mo.onclick = () => { mo.classList.add("on"); mp.classList.remove("on"); h.onMode("orbit"); };
  const lt = $("lTag"), ln = $("lNacht");
  lt.onclick = () => { lt.classList.add("on"); ln.classList.remove("on"); h.onNight(false); };
  ln.onclick = () => { ln.classList.add("on"); lt.classList.remove("on"); h.onNight(true); };

  $<HTMLInputElement>("part").oninput = e => { const v = +(e.target as HTMLInputElement).value; $("partV").textContent = v + " %"; h.onParticipation(v / 100); };
  $<HTMLInputElement>("brush").oninput = e => { const v = +(e.target as HTMLInputElement).value; $("brushV").textContent = v + " Sitze"; h.onBrush(v); };
  $("clear").onclick = () => h.onClear();
  $("demo").onclick = () => h.onDemo();
}

export function renderStats(choreo: Choreo) {
  const { cnt, total } = choreo.counts(), de = (n: number) => n.toLocaleString("de");
  let html = `<div class="row"><span>Plätze</span><b>${de(choreo.seats.length)}</b></div>`;
  PAPER.forEach((p, i) => { if (cnt[i]) html += `<div class="row"><span><i class="dot" style="background:${p.hex}"></i>${p.name}</span><b>${de(cnt[i]!)}</b></div>`; });
  html += `<div class="row" style="border-top:.5px solid var(--line);margin-top:4px;padding-top:4px"><span>Blätter</span><b>${de(total)}</b></div>`;
  html += `<div class="row"><span>Material ≈</span><b>${de(Math.round(total * 0.15))} €</b></div>`;
  $("stats").innerHTML = html;
}
