![Perseverance](docs/images/demo_percy.gif)
# Perseverance — Mars Rover Simulation

**English** · [Français](README.fr.md) · [Español](README.es.md)

A 3D simulation of NASA's Perseverance rover on Mars, built with Three.js. Drive the rover across the dunes, watch NASA's real telemetry in a mission control panel, and click the rover's cameras to see real photos taken on Mars in the last few days.

![Perseverance driving across the Martian dunes](docs/images/hero.png)

## Features

- **Drivable rover** — NASA's official 3D model, driven with the keyboard, leaving tracks in the sand.
- **Martian physics** — Mars gravity (3.71 m/s²), limited traction on slopes (it can't climb beyond ~29°), rolling resistance in the sand, and per-wheel rocker-bogie suspension.
- **Real wheels** — all 6 wheels spin at the speed of their contact point; the 4 corner wheels steer, and they angle diagonally for turns in place, just like the real rover.
- **Mission control** — inspired by NASA's [Open MCT](https://github.com/nasa/openmct): each data point has a name, a unit and a provider.
  - Distance driven, terrain elevation and tilt, from NASA's drive history.
  - Earth–Mars light time, computed live from the orbits of both planets.
  - Each one shows its value, a chart of the whole mission and a plain-language explanation.
- **Rover cameras** — Mastcam-Z, Navcam, Hazcam and WATSON glow on the model. Click one: shutter, flash, and a real photo develops in front of you.
- **Atmosphere** — butterscotch sky, low afternoon sun with shadows, suspended dust, Phobos and Deimos.

![Mission control panel](docs/images/mission-control.png)

![A real Mastcam-Z photo opened from the rover](docs/images/camera-photo.png)

## Data platform

The game is the last consumer of a small modern data stack that runs every day for free on GitHub Actions:

```
NASA drive history ─┐                     ┌─► marts ─► JSON ─► the game (public/data, public/photos)
NASA raw images API ─┼─ dlt ─► DuckDB ─► dbt ┤
orbits (Python) ─────┘                     └─► tests ─► dashboard · dbt docs (GitHub Pages)
                     Dagster: assets, lineage, checks, daily schedule
```

![Dagster asset lineage: ingestion → transformation → game](docs/images/dagster-lineage.png)

- **Ingestion — [dlt](https://dlthub.com):** drive history (full refresh), raw images (incremental on `date_received`, merged on `imageid`) and Earth–Mars light time per sol.
- **Warehouse — [DuckDB](https://duckdb.org):** a single file, `warehouse/percy.duckdb`.
- **Transformation — [dbt](https://www.getdbt.com):** `staging → intermediate → marts`, 32 tests and source freshness. Two real data issues it caught:
  - Intermediate stops reset the odometer to 0, which made the game's distance chart dip; the marts only keep confirmed stops.
  - Timestamps were shifted by the machine's time zone.
- **Photos, human-in-the-loop:** dbt rules filter colour, full-frame, large images from NASA's own IDs; the final aesthetic pick lives in the `photo_curation` seed.
- **Orchestration — [Dagster](https://dagster.io):** one asset graph from NASA to the game files. dbt tests show up as asset checks, and two blocking checks guard the game's data contract.
- **Dashboard — [Observable Framework](https://observablehq.com/framework/):** a static site built from the marts.
- **CI/CD — GitHub Actions:** PRs run ruff, pytest, the full pipeline and the in-browser game check. A daily job refreshes the data, commits it if it changed, and publishes the game, dashboard and dbt docs to GitHub Pages.

**Live:** [game](https://javiladino.github.io/perseverance/) · [dashboard](https://javiladino.github.io/perseverance/dashboard/) · [dbt docs](https://javiladino.github.io/perseverance/dbt/)

```bash
cd data
uv sync
uv run dbt parse --project-dir percy_dbt --profiles-dir percy_dbt
uv run dagster dev -m percy_pipeline.definitions   # UI at http://127.0.0.1:3000
```

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` (QWERTY) · `Z` `Q` `S` `D` (AZERTY) | Drive and steer |
| Mouse | Orbit the camera around the rover |
| `T` | Show / hide mission control |
| Click a glowing dot | Take a photo with that camera |
| Click the photo | Enlarge it |
| `←` `→` | More photos from the same camera |
| `Esc` | Back to the game |

## Getting started

Requires Node.js and Google Chrome (Chrome is only needed for `npm run check`).

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build in `dist/` |
| `npm run check` | Opens the game in Chrome and verifies the 4 data points load, that `T` hides the panel, that every camera opens a real photo, and that the console is error-free. Saves a screenshot to `screenshots/check-camara.png` |

## Project structure

```
src/
  main.js         scene, lights, render loop
  rover.js        model, controls and Martian physics
  wheels.js       splits the 6 wheels out of the model
  tracks.js       tracks in the sand
  telemetry.js    mini telemetry API (Open MCT pattern)
  providers.js    NASA drive history + Earth–Mars light time
  hud.js          mission control panel
  cameras.js      camera spots and photo viewer
  terrain.js, sky.js, rocks.js, dust.js, moons.js
public/
  models/         Perseverance 3D model (Draco)
  data/           telemetry.json exported from the dbt marts
  photos/         selected raw images + photos.json
scripts/
  check.mjs       automated in-browser check
data/
  percy_pipeline/ dlt ingestion, orbits, export, Dagster definitions
  percy_dbt/      dbt models, seeds and tests
  tests/          pytest
dashboard/        Observable Framework dashboard
.github/workflows/ CI and daily pipeline
mapa-del-repo.html  guide to Open MCT (in Spanish)
```

## Data and credits

- **3D model:** Perseverance, NASA/JPL-Caltech.
- **Drive history:** [M20_waypoints.json](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json), NASA/JPL-Caltech. Ingested by the data platform; the game only reads the exported marts.
- **Photos:** [Mars 2020 raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/), credited in each photo (NASA/JPL-Caltech, NASA/JPL-Caltech/ASU). Filtered by dbt rules and approved by hand in the `photo_curation` seed.
- **Orbits:** approximate orbital elements from JPL (Standish), valid 1800–2050.
- Built with [Three.js](https://threejs.org) and [Vite](https://vite.dev).

This is a personal, educational project and is not affiliated with NASA.
