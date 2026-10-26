import * as THREE from 'three';
import { fbm } from './noise.js';

function moon(radius, seed, lumpiness, stretch) {
  const geo = new THREE.IcosahedronGeometry(radius, 4);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = fbm(v.x * 2 + seed, v.y * 2 + v.z * 1.5 + seed, 4);
    v.multiplyScalar(radius * (1 + n * lumpiness));
    v.x *= stretch;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0x9a8a7c,
      roughness: 1,
      emissive: 0x3a2c22,
      emissiveIntensity: 0.6,
      fog: false,
    }),
  );
}

// Fobos (grande e irregular) y Deimos (pequeña), lejos en el cielo de la tarde.
export function createMoons() {
  const group = new THREE.Group();
  const phobos = moon(14, 3.1, 0.35, 1.35);
  phobos.position.set(260, 330, -620);
  const deimos = moon(6, 9.4, 0.25, 1.1);
  deimos.position.set(-120, 410, -700);
  group.add(phobos, deimos);
  group.userData = { phobos, deimos };
  return group;
}
