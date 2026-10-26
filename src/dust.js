import * as THREE from 'three';
import { rng } from './noise.js';

// Partículas de polvo suspendidas que derivan con el viento alrededor de la cámara.
// Shader propio: motas redondas y difusas de tamaño variado que se desvanecen
// pegadas a la cámara (si no, se ven como cuadrados gigantes) y a lo lejos.
const vertexShader = /* glsl */ `
  attribute float size;
  attribute float shade;
  varying float vAlpha;
  varying float vShade;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = -mvPosition.z;
    vAlpha = smoothstep(0.6, 3.0, dist) * (1.0 - smoothstep(25.0, 55.0, dist));
    vShade = shade;
    // Tamaño en píxeles con perspectiva, limitado para que ninguna mota tape la vista
    gl_PointSize = min(size * 300.0 / dist, 6.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  varying float vAlpha;
  varying float vShade;
  #include <fog_pars_fragment>
  void main() {
    // Disco suave: opaco en el centro y transparente en el borde
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.2, 1.0, r)) * vAlpha * opacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(color * vShade, a);
    #include <fog_fragment>
  }
`;

export function createDust(count = 2500, range = 60) {
  const rand = rng(7);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const shades = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * range * 2;
    positions[i * 3 + 1] = rand() * 12;
    positions[i * 3 + 2] = (rand() - 0.5) * range * 2;
    sizes[i] = 0.02 + rand() ** 3 * 0.05; // casi todas finas, unas pocas más gruesas
    shades[i] = 0.75 + rand() * 0.35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('shade', new THREE.BufferAttribute(shades, 1));

  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        { color: { value: new THREE.Color(0xc98d5a) }, opacity: { value: 0.5 } },
      ]),
      transparent: true,
      depthWrite: false,
      fog: true,
      toneMapped: false, // que el tone mapping no las aclare hasta el blanco
    }),
  );
  // Las motas se recolocan alrededor de la cámara; nunca recortarlas por su caja inicial
  points.frustumCulled = false;

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
