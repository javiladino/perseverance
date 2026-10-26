import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, heightAt } from './terrain.js';
import { createSky } from './sky.js';
import { createRocks } from './rocks.js';
import { createMoons } from './moons.js';
import { createDust } from './dust.js';

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
const eye = 2.2; // altura de la cámara del rover
camera.position.set(0, heightAt(0, 14) + eye, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, heightAt(0, -10) + 1.5, -10);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.53;
controls.minDistance = 4;
controls.maxDistance = 80;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;

// Sol de tarde, bajo sobre el horizonte, a contraluz parcial
const sunDir = new THREE.Vector3(-0.55, 0.16, -0.82).normalize();

const sun = new THREE.DirectionalLight(0xffbf80, 3.2);
sun.position.copy(sunDir).multiplyScalar(150);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 400 });
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.1);
  dust.userData.update(dt);
  moons.userData.phobos.rotation.y += dt * 0.02;
  controls.update();
  renderer.render(scene, camera);
});
