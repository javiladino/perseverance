import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { heightAt } from './terrain.js';
import { splitWheels } from './wheels.js';

const ROVER_LENGTH = 3.0; // m, Perseverance mide 3 m de largo, 2,7 m de ancho y 2,2 m de alto
const MAX_SPEED = 2.5; // m/s (el real va a ~0,04 m/s; aquí se acelera para poder explorar)
const ACCEL = 2.0; // empuje de los motores, m/s²
const TURN_RATE = 0.9; // rad/s
// Física de Marte
const GRAVITY = 3.71; // m/s², 38 % de la terrestre
const TRACTION = 0.55; // agarre en regolito: no sube pendientes de más de ~29°
const ROLLING = 0.08; // resistencia a la rodadura en arena
const SUSPENSION_TRAVEL = 0.25; // m que cada rueda puede subir o bajar (rocker-bogie)
const CAMERA_PART = /cam|lens|watson/i;
const NOT_CAMERA = /cover|wiring|bracket/i;

export async function createRover(url) {
  // El modelo de la NASA viene comprimido con Draco; el decodificador se sirve desde public/draco
  const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(url);
  draco.dispose();
  const model = gltf.scene;

  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  // Escala real: el eje largo del modelo es Z
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar(ROVER_LENGTH / size.z);
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);

  // El frente del modelo mira a +Z; lo giramos para que avance hacia -Z
  const pivot = new THREE.Group();
  pivot.rotation.y = Math.PI;
  pivot.add(model);
  const root = new THREE.Group();
  root.add(pivot);

  // Separación entre ruedas izquierda y derecha, para las huellas
  let trackHalfWidth = 1.0;
  const wheels = model.getObjectByName('Wheels_objs');
  if (wheels) {
    const wb = new THREE.Box3().setFromObject(wheels);
    trackHalfWidth = (wb.max.x - wb.min.x) / 2 - 0.2;
  }

  const wheelParts = wheels ? splitWheels(wheels, root) : [];

  const cameras = [];
  model.traverse((o) => {
    if (o.name && CAMERA_PART.test(o.name) && !NOT_CAMERA.test(o.name)) cameras.push(o.name);
  });
  console.log('Cámaras de Perseverance:', cameras.join(', '));

  const state = { yaw: 0, speed: 0, slope: 0, keys: new Set() };
  const onKey = (down) => (e) => {
    const k = e.key.toLowerCase();
    if ('wasd'.includes(k) && k.length === 1) {
      if (down) state.keys.add(k);
      else state.keys.delete(k);
    }
  };
  window.addEventListener('keydown', onKey(true));
  window.addEventListener('keyup', onKey(false));
  window.addEventListener('blur', () => state.keys.clear());

  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  const side = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const tilt = new THREE.Quaternion();
  const wheelWorld = new THREE.Vector3();

  function placeOnGround() {
    const { x, z } = root.position;
    forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    side.set(-forward.z, 0, forward.x);
    // Inclinación según la pendiente bajo las ruedas
    const hf = heightAt(x + forward.x * 1.3, z + forward.z * 1.3);
    const hb = heightAt(x - forward.x * 1.3, z - forward.z * 1.3);
    const hr = heightAt(x + side.x * trackHalfWidth, z + side.z * trackHalfWidth);
    const hl = heightAt(x - side.x * trackHalfWidth, z - side.z * trackHalfWidth);
    const fwd = forward.clone().setY((hf - hb) / 2.6).normalize();
    state.slope = fwd.y; // seno de la pendiente: + cuesta arriba
    const right = side.clone().setY((hr - hl) / (trackHalfWidth * 2)).normalize();
    up.crossVectors(right, fwd).normalize();
    basis.makeBasis(right, up, fwd.negate());
    tilt.setFromRotationMatrix(basis);
    root.quaternion.slerp(tilt, 0.25);
    root.position.y = (hf + hb + hl + hr) / 4;
    root.updateMatrixWorld();

    // Rocker-bogie: cada rueda busca su propio suelo dentro del recorrido de la suspensión
    for (const w of wheelParts) {
      const c = wheelWorld.copy(w.rest).applyMatrix4(root.matrixWorld);
      const gap = heightAt(c.x, c.z) - (c.y - w.radius);
      w.offset += (THREE.MathUtils.clamp(gap, -SUSPENSION_TRAVEL, SUSPENSION_TRAVEL) - w.offset) * 0.3;
      w.steer.position.y = w.rest.y + w.offset;
    }
  }

  // Cada rueda rueda a la velocidad de su punto de contacto (v + ω × r) y,
  // si es de esquina, se orienta hacia donde va: así gira sobre sí mismo como el real
  function updateWheels(dt, yawRate) {
    for (const w of wheelParts) {
      const { x, z } = w.rest;
      const vx = yawRate * z, vz = -(state.speed + yawRate * x);
      let angle = 0;
      if (Math.abs(z) > 0.5 && Math.hypot(vx, vz) > 0.01) angle = Math.atan(vx / vz);
      else if (Math.abs(z) > 0.5) angle = w.steer.rotation.y;
      w.steer.rotation.y += (angle - w.steer.rotation.y) * Math.min(1, dt * 6);
      const a = w.steer.rotation.y;
      const rolling = -vx * Math.sin(a) - vz * Math.cos(a);
      w.spin.rotation.x -= (rolling / w.radius) * dt;
    }
  }

  function update(dt) {
    const k = state.keys;
    const throttle = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
    if (throttle === 0) {
      // Sin acelerador los motores frenan y sujetan el rover, también en cuesta
      state.speed -= Math.sign(state.speed) * Math.min(Math.abs(state.speed), ACCEL * 1.5 * dt);
    } else {
      // Empuje limitado por el agarre, contra la gravedad de la pendiente y la arena
      const cos = Math.sqrt(1 - state.slope * state.slope);
      const grip = TRACTION * GRAVITY * cos;
      const drive = THREE.MathUtils.clamp(throttle * ACCEL, -grip, grip);
      const accel = drive - GRAVITY * state.slope - Math.sign(state.speed) * ROLLING * GRAVITY * cos;
      state.speed = THREE.MathUtils.clamp(state.speed + accel * dt, -MAX_SPEED * 0.5, MAX_SPEED);
    }
    const steer = (k.has('a') ? 1 : 0) - (k.has('d') ? 1 : 0);
    // Gira sobre sí mismo si está quieto; al ir marcha atrás se invierte la dirección
    const yawRate = steer * TURN_RATE * (state.speed < -0.05 ? -1 : 1);
    state.yaw += yawRate * dt;
    updateWheels(dt, yawRate);

    forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    root.position.addScaledVector(forward, state.speed * dt);
    placeOnGround();
  }

  placeOnGround();
  root.quaternion.copy(tilt);
  return { object: root, update, state, cameras, trackHalfWidth };
}
