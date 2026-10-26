import * as THREE from 'three';
import { heightAt } from './terrain.js';

// Textura de la huella: franjas transversales como las garras de las ruedas
function treadTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(40,16,8,0.55)';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(20,8,4,0.85)';
  for (let y = 0; y < 64; y += 16) g.fillRect(4, y, 56, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Huellas como parches instanciados en un búfer circular
export function createTracks(halfWidth, max = 6000) {
  const spacing = 0.22;
  const geo = new THREE.PlaneGeometry(0.4, spacing * 1.15);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    map: treadTexture(),
    transparent: true,
    depthWrite: false,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.count = 0;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  let next = 0;
  const last = new THREE.Vector3(Infinity, 0, Infinity);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  function stamp(x, z, yaw) {
    p.set(x, heightAt(x, z) + 0.03, z);
    q.setFromAxisAngle(yAxis, yaw);
    mesh.setMatrixAt(next, m.compose(p, q, one));
    next = (next + 1) % max;
    mesh.count = Math.min(mesh.count + 1, max);
    mesh.instanceMatrix.needsUpdate = true;
  }

  function update(position, yaw) {
    if (!Number.isFinite(last.x)) last.copy(position);
    const dist = Math.hypot(position.x - last.x, position.z - last.z);
    if (dist < spacing) return;
    // Rellena el tramo recorrido aunque el cuadro haya sido largo
    const sx = Math.cos(yaw) * halfWidth;
    const sz = -Math.sin(yaw) * halfWidth;
    const steps = Math.floor(dist / spacing);
    for (let i = 1; i <= steps; i++) {
      const t = (i * spacing) / dist;
      const x = last.x + (position.x - last.x) * t;
      const z = last.z + (position.z - last.z) * t;
      stamp(x + sx, z + sz, yaw);
      stamp(x - sx, z - sz, yaw);
    }
    last.lerp(position, (steps * spacing) / dist);
  }

  return { object: mesh, update };
}
