import * as THREE from 'three';

// Cielo marciano de tarde: caramelo polvoriento con halo azulado alrededor del sol.
export function createSky(sunDir) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(1000, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      uniforms: { uSunDir: { value: sunDir.clone().normalize() } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -0.1, 1.0);
          vec3 horizon = vec3(0.90, 0.64, 0.42);
          vec3 mid = vec3(0.72, 0.47, 0.30);
          vec3 zenith = vec3(0.36, 0.22, 0.15);
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.25, h));
          col = mix(col, zenith, smoothstep(0.2, 1.0, h));
          // Banda de polvo baja en el horizonte
          col = mix(col, vec3(0.80, 0.58, 0.40), exp(-abs(h) * 18.0) * 0.6);
          float s = max(dot(d, uSunDir), 0.0);
          // Halo azul frío del atardecer marciano
          col = mix(col, vec3(0.55, 0.68, 0.80), pow(s, 40.0) * 0.75);
          // Resplandor cálido amplio
          col += vec3(1.0, 0.75, 0.45) * pow(s, 6.0) * 0.18;
          // Disco solar pequeño
          col += vec3(1.0, 0.97, 0.9) * smoothstep(0.9994, 0.9998, s) * 2.5;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
}
