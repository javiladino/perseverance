// npm run check: arranca Vite, abre la simulación en Chrome y comprueba que
// el control de misión carga sus 4 datos, que T lo oculta y que no hay errores.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const KEYS = ['distance', 'elevation', 'tilt', 'light'];
const failures = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => (failures.push(msg), console.log(`  ✗ ${msg}`));

const server = await createServer({ logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(url);
  console.log(`Control de misión en ${url}`);

  try {
    await page.waitForFunction(
      (keys) => window.__mission && keys.every((k) => window.__mission.status[k] !== 'cargando'),
      KEYS, { timeout: 30000 },
    );
  } catch {
    fail('los datos no terminaron de cargar en 30 s');
  }

  const { status = {}, values = {} } = (await page.evaluate(() => window.__mission)) ?? {};
  for (const k of KEYS) {
    if (status[k] === 'ok' && Number.isFinite(values[k])) ok(`${k} = ${values[k]}`);
    else fail(`${k} no cargó (estado: ${status[k]})`);
  }

  // Los puntos de las cámaras salen cuando el rover terminó de cargar: a partir de ahí la escena responde
  const CAMS = ['MASTCAM', 'NAVCAM', 'HAZCAM', 'WATSON'];
  try {
    await page.waitForFunction((n) => document.querySelectorAll('.cam-spot').length === n, CAMS.length, { timeout: 30000 });
  } catch {
    fail('no aparecieron los puntos de las cámaras');
  }

  const panel = page.locator('#mission');
  // Sin GPU cada fotograma tarda segundos y la animación de desvanecer apenas avanza:
  // comprobamos el estado final (sin transición) en vez de esperar a que termine
  const hiddenState = () => panel.evaluate((el) => {
    el.style.transition = 'none';
    const cs = getComputedStyle(el);
    const hidden = el.classList.contains('hidden') && cs.opacity === '0' && cs.pointerEvents === 'none';
    el.style.transition = '';
    return hidden;
  });
  await page.keyboard.press('t');
  await page.waitForTimeout(400);
  (await hiddenState()) ? ok('T oculta el panel') : fail('T no oculta el panel');
  await page.keyboard.press('t');
  await page.waitForTimeout(400);
  (await panel.evaluate((el) => !el.classList.contains('hidden'))) ? ok('T lo vuelve a mostrar') : fail('T no lo vuelve a mostrar');

  // Cámaras: cada una abre una foto real; con la de Mastcam-Z se guarda una captura
  for (const cam of CAMS) {
    const spot = page.locator(`.cam-spot[data-camera="${cam}"]`);
    if (cam === 'MASTCAM' && (await spot.isVisible())) await spot.click();
    else await spot.evaluate((el) => el.click()); // puede quedar fuera de cuadro según el ángulo
    const opened = await page
      .waitForFunction((c) => window.__cameras?.open === c && window.__cameras.loaded
        && document.querySelector('#cam-viewer img').naturalWidth > 0, cam, { timeout: 15000 })
      .then(() => true, () => false);
    if (!opened) {
      fail(`${cam} no abrió una foto`);
      continue;
    }
    const caption = await page.locator('#cam-viewer figcaption').innerText();
    ok(`${cam} abre una foto (${caption.split('\n')[0]})`);
    if (cam === 'MASTCAM') {
      await page.waitForTimeout(3000); // que termine de revelarse
      await mkdir('screenshots', { recursive: true });
      await page.screenshot({ path: 'screenshots/check-camara.png' });
      ok('captura guardada en screenshots/check-camara.png');
    }
    await page.keyboard.press('Escape');
  }

  errors.length ? errors.forEach((e) => fail(`consola: ${e}`)) : ok('consola sin errores');
} finally {
  await browser.close();
  await server.close();
}

console.log(failures.length ? `\n${failures.length} fallo(s)` : '\nTodo bien');
process.exit(failures.length ? 1 : 0);
