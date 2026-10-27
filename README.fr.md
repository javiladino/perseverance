![Perseverance](docs/images/demo_percy.gif)
# Perseverance — Simulation du rover martien

[English](README.md) · **Français** · [Español](README.es.md)

Une simulation 3D du rover Perseverance de la NASA sur Mars, réalisée avec Three.js. Pilotez le rover à travers les dunes, suivez la télémétrie réelle de la NASA dans un panneau de contrôle de mission, et cliquez sur les caméras du rover pour voir de vraies photos prises sur Mars ces derniers jours.

![Perseverance roulant à travers les dunes martiennes](docs/images/hero.png)

## Fonctionnalités

- **Rover pilotable** — le modèle 3D officiel de la NASA, piloté au clavier, qui laisse des traces dans le sable.
- **Physique martienne** — gravité de Mars (3,71 m/s²), adhérence limitée en pente (il ne monte pas au-delà de ~29°), résistance au roulement dans le sable et suspension rocker-bogie roue par roue.
- **Vraies roues** — les 6 roues tournent à la vitesse de leur point de contact ; les 4 roues d'angle s'orientent, et se placent en diagonale pour tourner sur place, comme le vrai rover.
- **Contrôle de mission** — inspiré d'[Open MCT](https://github.com/nasa/openmct) de la NASA : chaque donnée a un nom, une unité et un fournisseur.
  - Distance parcourue, altitude du terrain et inclinaison, issues de l'historique des trajets de la NASA.
  - Temps-lumière Terre–Mars, calculé en direct à partir des orbites des deux planètes.
  - Chacune affiche sa valeur, un graphique de toute la mission et une explication simple.
- **Caméras du rover** — Mastcam-Z, Navcam, Hazcam et WATSON brillent sur le modèle. Cliquez : obturateur, flash, et une vraie photo se révèle sous vos yeux.
- **Ambiance** — ciel caramel, soleil bas d'après-midi avec ombres, poussière en suspension, Phobos et Deimos.

![Panneau de contrôle de mission](docs/images/mission-control.png)

![Une vraie photo Mastcam-Z ouverte depuis le rover](docs/images/camera-photo.png)

## Commandes

| Touche | Action |
|---|---|
| `W` `A` `S` `D` | Avancer, reculer et tourner (touches QWERTY : sur un clavier AZERTY, `Z` `Q` `S` `D` ne fonctionnent pas encore) |
| Souris | Tourner la caméra autour du rover |
| `T` | Afficher / masquer le contrôle de mission |
| Clic sur un point lumineux | Prendre une photo avec cette caméra |
| Clic sur la photo | L'agrandir |
| `←` `→` | Autres photos de la même caméra |
| `Échap` | Revenir au jeu |

## Démarrage

Nécessite Node.js et Google Chrome (Chrome sert uniquement à `npm run check`).

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production dans `dist/` |
| `npm run check` | Ouvre le jeu dans Chrome et vérifie que les 4 données se chargent, que `T` masque le panneau, que chaque caméra ouvre une vraie photo et que la console est sans erreur. Enregistre une capture dans `screenshots/check-camara.png` |
| `npm run datos:nasa` | Télécharge la dernière copie de l'historique des trajets de la NASA dans `public/data/` |

## Structure du projet

```
src/
  main.js         scène, lumières, boucle de rendu
  rover.js        modèle, commandes et physique martienne
  wheels.js       sépare les 6 roues du modèle
  tracks.js       traces dans le sable
  telemetry.js    mini API de télémétrie (modèle Open MCT)
  providers.js    historique des trajets NASA + temps-lumière Terre–Mars
  hud.js          panneau de contrôle de mission
  cameras.js      points des caméras et visionneuse de photos
  terrain.js, sky.js, rocks.js, dust.js, moons.js
public/
  models/         modèle 3D de Perseverance (Draco)
  data/           copie de l'historique des trajets NASA
  photos/         images brutes sélectionnées + photos.json
scripts/
  check.mjs       vérification automatique dans le navigateur
  fetch-nasa.mjs  met à jour l'historique des trajets
mapa-del-repo.html  guide d'Open MCT (en espagnol)
```

## Données et crédits

- **Modèle 3D :** Perseverance, NASA/JPL-Caltech.
- **Historique des trajets :** [M20_waypoints.json](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json), NASA/JPL-Caltech. Une copie locale est conservée car le serveur de la NASA bloque les navigateurs sans interface (headless).
- **Photos :** [images brutes de Mars 2020](https://mars.nasa.gov/mars2020/multimedia/raw-images/), crédit indiqué sur chaque photo (NASA/JPL-Caltech, NASA/JPL-Caltech/ASU). Choisies à la main : en couleur, sans ciel vide, sans soleil, sans cibles d'étalonnage.
- **Orbites :** éléments orbitaux approchés du JPL (Standish), valables de 1800 à 2050.
- Réalisé avec [Three.js](https://threejs.org) et [Vite](https://vite.dev).

Projet personnel et éducatif, sans lien avec la NASA.
