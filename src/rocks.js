import * as THREE from 'three';
import { fbm, rng } from './noise.js';
import { heightAt } from './terrain.js';

function rockGeometry(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 1.7 + seed * 13.1, v.z * 1.7 + v.y * 1.3 + seed * 7.7, 4);
    v.multiplyScalar(1 + n * 0.55);
    v.y *= 0.6; // rocas más achatadas
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createRocks() {
  const group = new THREE.Group();
  const rand = rng(42);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b3b24, roughness: 0.9, flatShading: true });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let variant = 0; variant < 4; variant++) {
    const count = 90;
    const mesh = new THREE.InstancedMesh(rockGeometry(variant + 1), mat, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.pow(rand(), 1.6) * 120;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const big = rand() < 0.08;
      const size = big ? 1.2 + rand() * 1.6 : 0.12 + Math.pow(rand(), 2) * 0.7;
      s.set(size * (0.8 + rand() * 0.5), size, size * (0.8 + rand() * 0.5));
      p.set(x, heightAt(x, z) + size * 0.15, z);
      q.setFromEuler(e.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4));
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    group.add(mesh);
  }
  return group;
}
