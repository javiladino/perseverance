import * as THREE from 'three';
import { rng } from './noise.js';

// Partículas de polvo suspendidas que derivan con el viento alrededor de la cámara.
export function createDust(count = 2500, range = 60) {
  const rand = rng(7);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * range * 2;
    positions[i * 3 + 1] = rand() * 12;
    positions[i * 3 + 2] = (rand() - 0.5) * range * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xe3b07c,
      size: 0.07,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );

  points.userData.update = (dt) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3] += dt * 1.2;
      p[i * 3 + 1] += Math.sin((p[i * 3] + i) * 0.3) * dt * 0.1;
      if (p[i * 3] > range) p[i * 3] -= range * 2;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return points;
}
