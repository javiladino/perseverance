![Perseverance](docs/images/demo_percy.gif)
# Perseverance — Simulation du rover martien

[![CI](https://github.com/javiladino/perseverance/actions/workflows/ci.yml/badge.svg)](https://github.com/javiladino/perseverance/actions/workflows/ci.yml)
[![Pipeline](https://github.com/javiladino/perseverance/actions/workflows/pipeline.yml/badge.svg)](https://github.com/javiladino/perseverance/actions/workflows/pipeline.yml)

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

## Plateforme de données

Le jeu est le dernier consommateur d'une petite *modern data stack* qui tourne chaque jour, gratuitement, sur GitHub Actions :

```
Historique des trajets NASA ─┐                     ┌─► marts ─► JSON ─► le jeu (public/data, public/photos)
API d'images brutes NASA ────┼─ dlt ─► DuckDB ─► dbt ┤
orbites (Python) ────────────┘                     └─► tests ─► tableau de bord · docs dbt (GitHub Pages)
                             Dagster : assets, lignage, checks, planification quotidienne
```

![Lignage des assets dans Dagster : ingestion → transformation → jeu](docs/images/dagster-lineage.png)

- **Ingestion — [dlt](https://dlthub.com) :** historique des trajets (rechargement complet), images brutes (incrémental sur `date_received`, fusion sur `imageid`) et temps-lumière Terre–Mars par sol.
- **Entrepôt — [DuckDB](https://duckdb.org) :** un seul fichier, `warehouse/percy.duckdb`.
- **Transformation — [dbt](https://www.getdbt.com) :** `staging → intermediate → marts`, 32 tests et contrôle de fraîcheur des sources. Deux vrais problèmes de données détectés :
  - Les arrêts intermédiaires remettaient l'odomètre à 0 et faisaient plonger le graphique de distance du jeu ; les marts ne gardent que les arrêts confirmés.
  - Les horodatages étaient décalés selon le fuseau horaire de la machine.
- **Photos, avec un humain dans la boucle :** des règles dbt filtrent les images couleur, plein cadre et grandes à partir des identifiants de la NASA ; le choix esthétique final se trouve dans le seed `photo_curation`.
- **Orchestration — [Dagster](https://dagster.io) :** un seul graphe d'assets, de la NASA aux fichiers du jeu. Les tests dbt apparaissent comme asset checks, et deux checks bloquants protègent le contrat de données du jeu.
- **Tableau de bord — [Observable Framework](https://observablehq.com/framework/) :** un site statique construit à partir des marts.
- **CI/CD — GitHub Actions :** les PR lancent ruff, pytest, le pipeline complet et la vérification du jeu dans le navigateur. Une tâche quotidienne rafraîchit les données, les commite si elles ont changé, puis publie le jeu, le tableau de bord et les docs dbt sur GitHub Pages.

**En ligne :** [jeu](https://javiladino.github.io/perseverance/) · [tableau de bord](https://javiladino.github.io/perseverance/dashboard/) · [docs dbt](https://javiladino.github.io/perseverance/dbt/)

```bash
cd data
uv sync
uv run dbt parse --project-dir percy_dbt --profiles-dir percy_dbt
uv run dagster dev -m percy_pipeline.definitions   # interface sur http://127.0.0.1:3000
```

## Commandes

| Touche | Action |
|---|---|
| `W` `A` `S` `D` (QWERTY) · `Z` `Q` `S` `D` (AZERTY) | Avancer, reculer et tourner |
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
  data/           telemetry.json exporté depuis les marts dbt
  photos/         images brutes sélectionnées + photos.json
scripts/
  check.mjs       vérification automatique dans le navigateur
data/
  percy_pipeline/ ingestion dlt, orbites, export, définitions Dagster
  percy_dbt/      modèles, seeds et tests dbt
  tests/          pytest
dashboard/        tableau de bord Observable Framework
.github/workflows/ CI et pipeline quotidien
mapa-del-repo.html  guide d'Open MCT (en espagnol)
```

## Données et crédits

- **Modèle 3D :** Perseverance, NASA/JPL-Caltech.
- **Historique des trajets :** [M20_waypoints.json](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json), NASA/JPL-Caltech. Chargé par la plateforme de données ; le jeu ne lit que les marts exportés.
- **Photos :** [images brutes de Mars 2020](https://mars.nasa.gov/mars2020/multimedia/raw-images/), crédit indiqué sur chaque photo (NASA/JPL-Caltech, NASA/JPL-Caltech/ASU). Filtrées par des règles dbt et approuvées à la main dans le seed `photo_curation`.
- **Orbites :** éléments orbitaux approchés du JPL (Standish), valables de 1800 à 2050.
- Réalisé avec [Three.js](https://threejs.org) et [Vite](https://vite.dev).

Projet personnel et éducatif, sans lien avec la NASA.
