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
| `npm run datos:nasa` | Downloads the latest copy of NASA's drive history to `public/data/` |

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
  data/           copy of NASA's drive history
  photos/         selected raw images + photos.json
scripts/
  check.mjs       automated in-browser check
  fetch-nasa.mjs  updates the drive history
mapa-del-repo.html  guide to Open MCT (in Spanish)
```

## Data and credits

- **3D model:** Perseverance, NASA/JPL-Caltech.
- **Drive history:** [M20_waypoints.json](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json), NASA/JPL-Caltech. A local copy is kept because NASA's server blocks requests from headless browsers.
- **Photos:** [Mars 2020 raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/), credited in each photo (NASA/JPL-Caltech, NASA/JPL-Caltech/ASU). Hand-picked: in color, no empty sky, no sun, no calibration targets.
- **Orbits:** approximate orbital elements from JPL (Standish), valid 1800–2050.
- Built with [Three.js](https://threejs.org) and [Vite](https://vite.dev).

This is a personal, educational project and is not affiliated with NASA.
