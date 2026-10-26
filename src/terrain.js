import * as THREE from 'three';
import { fbm, noise2 } from './noise.js';

// Altura del terreno en (x, z): ondulación amplia + crestas de duna + rizos finos.
export function heightAt(x, z) {
  const base = fbm(x * 0.006, z * 0.006, 4) * 10;
  // Crestas afiladas (ridged) orientadas por el viento
  const w = x * 0.035 + z * 0.012 + fbm(x * 0.01, z * 0.01, 3) * 2.5;
  const ridge = 1 - Math.abs(Math.sin(w));
  const dunes = Math.pow(ridge, 2.2) * 3.2;
  const ripples = Math.sin(x * 0.9 + z * 0.35 + noise2(x * 0.1, z * 0.1) * 3) * 0.04;
  // Llanura más suave cerca de la cámara
  const r = Math.hypot(x, z);
  const flat = THREE.MathUtils.smoothstep(r, 6, 40);
  return (base + dunes * flat) * (0.35 + 0.65 * flat) + ripples;
}

export function createTerrain() {
  const size = 600;
  const geo = new THREE.PlaneGeometry(size, size, 320, 320);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dark = new THREE.Color(0x7a3a1e);
  const ochre = new THREE.Color(0xc87a45);
  const light = new THREE.Color(0xd9a06a);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const n = fbm(x * 0.05, z * 0.05, 3) * 0.5 + 0.5;
    c.copy(dark).lerp(ochre, n);
    c.lerp(light, THREE.MathUtils.clamp(y * 0.05 + 0.2, 0, 0.6));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 }),
  );
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}
