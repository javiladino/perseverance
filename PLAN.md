# Paisaje de Marte con Vite + Three.js

## Contexto
La carpeta solo tiene CLAUDE.md, .gitignore y .git. Se quiere una escena de Marte "de película" (dunas, rocas, cielo caramelo con polvo, sol de tarde cálido con sombras suaves, Fobos y Deimos), visible en vivo en el navegador de VS Code (Simple Browser), con un `npm run check` que haga captura + errores de consola usando el Chrome instalado.

**Bloqueo detectado:** Node/npm no están instalados (Homebrew sí, Chrome sí en /Applications). Paso 0: `brew install node`.

## Pasos
0. `brew install node` (~1 min).
1. Crear a mano (sin `npm create`, para ir rápido): `package.json`, `index.html`, `src/main.js`, `vite.config.js` (host 127.0.0.1, puerto 5173 fijo). `npm i three` + `npm i -D vite playwright-core` (playwright-core no descarga navegadores).
2. **Primera versión (<2 min):** plano con dunas por ruido, cielo con gradiente caramelo, luz direccional cálida baja, niebla. Arrancar `npm run dev` en segundo plano y dar la URL `http://127.0.0.1:5173`.
3. **Mejoras:**
   - Terreno: `PlaneGeometry` grande desplazado con ruido fBm + crestas de duna (ridged noise), vertex colors óxido/ocre, normales recalculadas.
   - Rocas: `IcosahedronGeometry` deformadas con ruido, `InstancedMesh` repartidas, que proyectan/reciben sombra.
   - Cielo: shader en esfera grande — gradiente caramelo→marrón polvoriento, halo azulado alrededor del sol (rasgo real del atardecer marciano), disco solar pequeño.
   - Luz: `DirectionalLight` cálida baja + `HemisphereLight`, `PCFSoftShadowMap`, `ACESFilmicToneMapping`, `FogExp2` color polvo.
   - Polvo: `Points` flotando lentamente.
   - Lunas: Fobos (más grande, irregular) y Deimos (pequeña) como mallas con emisión tenue en el cielo.
   - `OrbitControls` con cámara a altura de rover y leve auto-rotación.
4. **`npm run check`** → `scripts/check.mjs`: `playwright-core` `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] })`; levanta su propio Vite si 5173 no responde; recoge `console` error + `pageerror`; espera ~3 s; guarda `screenshots/check.png`; imprime errores y sale con código 1 si hay.
5. Correr check tras la primera versión y tras cada mejora grande, leer la captura, corregir. Máximo 3 rondas.

## Archivos
- `package.json` (scripts `dev`, `build`, `check`), `vite.config.js`, `index.html`
- `src/main.js` (escena, render loop), `src/terrain.js`, `src/sky.js`, `src/rocks.js`, `src/moons.js`, `src/dust.js`
- `scripts/check.mjs`; añadir `node_modules`, `dist`, `screenshots` a `.gitignore`

## Verificación
`npm run check` sin errores de consola y la captura `screenshots/check.png` mostrando dunas, rocas, cielo caramelo con polvo, sol bajo con sombras suaves y las dos lunas. Servidor dev sigue corriendo para verlo en VS Code.
