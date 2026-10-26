import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, heightAt } from './terrain.js';
import { createSky } from './sky.js';
import { createRocks } from './rocks.js';
import { createMoons } from './moons.js';
import { createDust } from './dust.js';
import { createRover } from './rover.js';
import { createTracks } from './tracks.js';
import { createTelemetry } from './telemetry.js';
import { createWaypointsProvider, createLightTimeProvider } from './providers.js';
import { createMissionControl } from './hud.js';
import { createCameraSpots } from './cameras.js';

// Control de misión: cada dato con su nombre, unidad y proveedor, como en Open MCT
const telemetry = createTelemetry();
const waypoints = createWaypointsProvider();
const NASA = 'NASA · manejos';
telemetry.addPoint({ key: 'distance', name: 'Distancia recorrida', unit: 'km', digits: 2, source: NASA,
  meaning: 'Todo lo que Percy ha rodado desde que aterrizó.' }, waypoints);
telemetry.addPoint({ key: 'elevation', name: 'Altura del terreno', unit: 'm', digits: 0, source: NASA,
  meaning: 'Altura respecto al “nivel del mar” de Marte. Sube porque escala el borde del cráter.' }, waypoints);
telemetry.addPoint({ key: 'tilt', name: 'Inclinación', unit: '°', digits: 1, source: NASA,
  meaning: 'Cuánto se ladea el rover en cada parada. A más grados, más empinado el suelo.' }, waypoints);
telemetry.addPoint({ key: 'light', name: 'Tiempo de luz Tierra–Marte', unit: 'min', digits: 2, source: 'calculado en vivo',
  meaning: 'Lo que tarda una orden nuestra en llegar a Percy. Por eso maneja solo.' }, createLightTimeProvider());
createMissionControl(telemetry);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc7916a, 0.0085);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, heightAt(0, 9) + 3.2, 9);

// La cámara orbita alrededor del rover con el ratón y lo sigue cuando avanza
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, heightAt(0, 0) + 1.2, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 4;
controls.maxDistance = 40;

// Sol de tarde, bajo sobre el horizonte, a contraluz parcial
const sunDir = new THREE.Vector3(-0.55, 0.16, -0.82).normalize();

const sun = new THREE.DirectionalLight(0xffbf80, 3.2);
sun.position.copy(sunDir).multiplyScalar(150);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 400 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.05;
sun.shadow.radius = 5;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(0xe8a874, 0x4a2414, 0.9));

scene.add(createSky(sunDir));
scene.add(createTerrain());
scene.add(createRocks());
const moons = createMoons();
scene.add(moons);
const dust = createDust();
scene.add(dust);

let rover = null;
let tracks = null;
let cameraSpots = null;
createRover(`${import.meta.env.BASE_URL}models/perseverance.glb`)
  .then((r) => {
    rover = r;
    tracks = createTracks(r.trackHalfWidth);
    scene.add(r.object, tracks.object);
    return createCameraSpots(r.object).then((c) => (cameraSpots = c));
  })
  .catch((err) => console.error('No se pudo cargar el rover:', err));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const LIMIT = 250; // borde del terreno
const prev = new THREE.Vector3();
const delta = new THREE.Vector3();

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.1);

  if (rover) {
    const p = rover.object.position;
    prev.copy(p);
    rover.update(dt);
    p.x = THREE.MathUtils.clamp(p.x, -LIMIT, LIMIT);
    p.z = THREE.MathUtils.clamp(p.z, -LIMIT, LIMIT);
    tracks.update(p, rover.state.yaw);

    // Desplaza cámara y objetivo lo mismo que el rover para conservar el encuadre
    delta.subVectors(p, prev);
    camera.position.add(delta);
    controls.target.set(p.x, p.y + 1.2, p.z);
    camera.position.y = Math.max(camera.position.y, heightAt(camera.position.x, camera.position.z) + 0.8);

    sun.target.position.copy(p);
    sun.position.copy(p).addScaledVector(sunDir, 150);
    dust.position.set(p.x, 0, p.z);
  }

  dust.userData.update(dt);
  moons.userData.phobos.rotation.y += dt * 0.02;
  controls.update();
  cameraSpots?.update(camera);
  renderer.render(scene, camera);
});
