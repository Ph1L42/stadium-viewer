# Blockwerk

Simulator zum Vorplanen von Fan-Choreographien: parametrisch erzeugtes Stadion in 3D, Malen direkt auf die Tribüne, Blattzahlen und Materialkosten live.

## Stack

- **Vite + TypeScript + Three.js** – reine Client-App, statisch deploybar
- **Vitest** – Tests für Geometrie und Blockaufteilung (ohne Browser)
- UI vorerst in Plain-TS; React + Zustand, sobald Ebenen/Timeline/Export dazukommen

## Starten

```sh
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # tsc + vite build → dist/
```

## Struktur

```
src/
  stadium/   reine Geometrie, kein Three.js
    types.ts       Stadion-Parameter, Ränge, Blockaufteilung
    presets.ts     Beispielstadion
    bowl.ts        Stadionkurve, Stufenprofil, Treppenlinien
    seats.ts       blockweise Sitzplatzierung
  render/    Three.js-Szene
    stadium.ts     Rasen, Tribüne, Dach, Logen, Treppen, Mundlöcher
    seats.ts       instanzierte Sitze + Papierblätter
    camera.ts      Orbit-Kamera mit Presets
    scene.ts       Renderer, Licht, Tag/Nacht
  paint/     Choreo-Zustand (Farbe je Sitz, Beteiligung, Demo-Motiv)
  ui/        DOM-Overlay
test/        Vitest
```

Ein Stadion wird komplett aus `StadiumParams` erzeugt: Spielfeldmaße, Auslauf, Eckradius, Reihen und Steigung je Rang, Blöcke je Seite und Keile je Ecke. Kein 3D-Modell nötig.

## Bedienung

Ziehen malt, Alt gedrückt halten dreht, Mausrad zoomt, rechte Taste verschiebt. Kamerapresets oben rechts, Papierfarben links, Szene-Einstellungen unten rechts.

## Fahrplan

1. Echte Kameraprojektion beim Malen (statt Kugelpinsel) – Motiv im Kameraraum entwerfen, auf Sitze rastern
2. Ebenen: Text, Formen, Logo-Import mit Farbreduktion und Lesbarkeitsprüfung
3. Abwicklung als 2D-Kontrollansicht
4. Blocknummern als HTML-Overlay, Verteilplan pro Block, Export (PDF/CSV/JSON)
5. Stadion-Editor im UI, Community-Stadien
6. Timeline für mehrteilige Choreos
