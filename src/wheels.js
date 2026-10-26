import * as THREE from 'three';

// El modelo de la NASA trae las 6 ruedas en una sola malla (Wheels_objs).
// La partimos en 6 por posición (izquierda/derecha × delante/medio/detrás)
// para que cada rueda gire, se oriente y suba o baje por su cuenta.
export function splitWheels(wheelsNode, root) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();

  // Triángulos de todas las primitivas, ya en coordenadas del rover (metros)
  const parts = [];
  wheelsNode.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.toNonIndexed();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toRoot, o.matrixWorld));
    parts.push({ geo, material: o.material });
  });

  // Agrupa en 3 filas por z con k-means 1D
  const pos = (g, t) => g.attributes.position.array.subarray(t * 9, t * 9 + 9);
  const centroid = (a) => [(a[0] + a[3] + a[6]) / 3, (a[1] + a[4] + a[7]) / 3, (a[2] + a[5] + a[8]) / 3];
  const zs = parts.flatMap(({ geo }) =>
    Array.from({ length: geo.attributes.position.count / 3 }, (_, t) => centroid(pos(geo, t))[2]));
  const rows = [Math.min(...zs), 0, Math.max(...zs)];
  for (let it = 0; it < 10; it++) {
    const sum = [0, 0, 0], n = [0, 0, 0];
    for (const z of zs) {
      const r = nearest(rows, z);
      sum[r] += z;
      n[r]++;
    }
    rows.forEach((_, r) => n[r] && (rows[r] = sum[r] / n[r]));
  }

  // Reparte triángulos en 6 ruedas y por material
  const buckets = Array.from({ length: 6 }, () => parts.map(() => []));
  parts.forEach(({ geo }, p) => {
    for (let t = 0; t < geo.attributes.position.count / 3; t++) {
      const c = centroid(pos(geo, t));
      buckets[(c[0] > 0 ? 3 : 0) + nearest(rows, c[2])][p].push(t);
    }
  });

  const wheels = buckets.map((perPart) => {
    const box = new THREE.Box3();
    const meshes = perPart.flatMap((tris, p) => {
      if (!tris.length) return [];
      const src = parts[p].geo;
      const geo = new THREE.BufferGeometry();
      for (const [name, attr] of Object.entries(src.attributes)) {
        const k = attr.itemSize * 3;
        const out = new attr.array.constructor(tris.length * k);
        tris.forEach((t, i) => out.set(attr.array.subarray(t * k, t * k + k), i * k));
        geo.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize, attr.normalized));
      }
      geo.computeBoundingBox();
      box.union(geo.boundingBox);
      const mesh = new THREE.Mesh(geo, parts[p].material);
      mesh.castShadow = mesh.receiveShadow = true;
      return [mesh];
    });

    // Jerarquía: dirección (eje Y) → giro (eje X) → malla centrada en el eje
    const center = box.getCenter(new THREE.Vector3());
    const steer = new THREE.Group();
    const spin = new THREE.Group();
    steer.position.copy(center);
    steer.add(spin);
    for (const m of meshes) {
      m.position.copy(center).negate();
      spin.add(m);
    }
    root.add(steer);
    return { steer, spin, rest: center.clone(), radius: (box.max.y - box.min.y) / 2, offset: 0 };
  });

  wheelsNode.removeFromParent();
  parts.forEach(({ geo }) => geo.dispose());
  return wheels;
}

function nearest(rows, z) {
  let best = 0;
  for (let r = 1; r < rows.length; r++) if (Math.abs(rows[r] - z) < Math.abs(rows[best] - z)) best = r;
  return best;
}
