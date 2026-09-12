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
    presets.ts     Stadien-Registry
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

Jedes Stadion steht als `StadiumParams` in `presets.ts` (Registry `STADIUMS`, Start über `DEFAULT_STADIUM`). Voreingestellt ist das „Stadion am Kurt Landauer Weg“, nach den Kennzahlen der Allianz Arena parametrisiert: **75.024 Plätze** (59.051 Sitz-, 15.973 Stehplätze) auf drei Rängen, Logenring zwischen Mittel- und Oberrang, 34°-Oberrang, Oberkante der Sitze bei 40 m, Grundfläche ca. 261 × 224 m. Ein Stadion wird komplett aus diesen Parametern erzeugt: Spielfeldmaße, Auslauf, Eckradius, Reihen und Steigung je Rang, Blöcke je Seite und Keile je Ecke. Kein 3D-Modell nötig.

### Blöcke

Die Blockaufteilung folgt dem Blockplan der Arena: 36 Blöcke im Unterrang (101–136), je 48 in Mittel- (201–248) und Oberrang (301–348). Jeder Sitz kennt seine Blocknummer. Vergeben werden sie über `blockFirst` und `blockAnchor` je Rang: vom Anker aus laufen die Nummern gegen den Umlaufsinn der Kurve, im Plan also nach links. Anker ist entweder die Ecke Nordseite/Ostkurve (Unter- und Mittelrang, 101 liegt rechts außen auf der Längsseite) oder die Mitte der Nordseite (Oberrang, 301 und 348 liegen beidseits der Mittellinie).

Wie viele Blöcke auf Gerade, Torseite und Ecke entfallen, folgt der Bogenlänge: die Geraden bleiben bei wachsendem Umlauf gleich lang, der gesamte Zuwachs steckt in den Eckbögen. Die oberen Ränge brauchen deshalb deutlich mehr Keil- als Geradenblöcke, damit alle Blöcke wie im Plan etwa gleich groß bleiben — ein Test hält das Verhältnis fest.

### Stehplätze

`standing` weist Blockbereiche als Stehplätze aus: die Südkurve (109–117) und die Nordkurve (129–135) im Unterrang. Dort stehen die Leute mit engerem Platzabstand, die Sitze sind hochgeklappt. Erst dadurch erreicht die Arena ihre nationale Kapazität — rein bestuhlt wären es rund 69.500 Plätze. Der Platzabstand ist auf `CAPACITY_KURT_LANDAUER_WEG` kalibriert; ein Test in `test/bowl.test.ts` hält die Zahl fest, weil sie aus der Geometrie entsteht und auf jede Parameteränderung reagiert.

## Bedienung

Ziehen malt, Alt gedrückt halten dreht, Mausrad zoomt, rechte Taste verschiebt. Kamerapresets oben rechts, Papierfarben links, Szene-Einstellungen unten rechts.

## Fahrplan

1. Echte Kameraprojektion beim Malen (statt Kugelpinsel) – Motiv im Kameraraum entwerfen, auf Sitze rastern
2. Ebenen: Text, Formen, Logo-Import mit Farbreduktion und Lesbarkeitsprüfung
3. Abwicklung als 2D-Kontrollansicht
4. Blocknummern als HTML-Overlay, Verteilplan pro Block, Export (PDF/CSV/JSON)
5. Stadion-Editor im UI, Community-Stadien
6. Timeline für mehrteilige Choreos
