import * as THREE from 'three';
import { t } from './i18n.js';

// Las cámaras de Percy como puntos que brillan sobre su pieza del modelo.
// Clic: obturador, flash y una foto real de esa cámara que se revela poco a poco.
const CAMERAS = [
  { node: 'Mastcam_Z_cams', key: 'MASTCAM' },
  { node: 'NavCams', key: 'NAVCAM' },
  { node: 'hazcams_front', key: 'HAZCAM' },
  { node: 'WATSON', key: 'WATSON' },
];

const SPOT_GAP = 26; // px mínimos entre puntos

const CSS = `
.cam-spot{position:fixed;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:0;padding:0;cursor:pointer;
  background:radial-gradient(circle,#fff 0 22%,#7fe3ff 35%,rgba(80,200,255,.35) 60%,transparent 72%);
  box-shadow:0 0 12px 3px rgba(110,215,255,.75);animation:cam-pulse 1.6s ease-in-out infinite;z-index:5}
.cam-spot:hover,.cam-spot:focus-visible{animation:none;transform:scale(1.5);outline:none}
.cam-spot span{position:absolute;left:24px;top:50%;transform:translateY(-50%);white-space:nowrap;pointer-events:none;
  font:12px/1 ui-monospace,Menlo,monospace;color:#e8f8ff;background:rgba(10,25,35,.85);border:1px solid rgba(110,215,255,.5);
  padding:6px 8px;border-radius:6px;opacity:0;transition:opacity .15s}
.cam-spot:hover span,.cam-spot:focus-visible span{opacity:1}
@keyframes cam-pulse{50%{box-shadow:0 0 22px 7px rgba(110,215,255,.95)}}
#cam-viewer{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(8,4,2,.78);
  font:13px/1.4 ui-monospace,Menlo,monospace;color:#ffe2c6}
#cam-viewer.open{display:flex}
#cam-viewer .shutter{position:absolute;left:0;right:0;height:50%;background:#000;z-index:3;transform:scaleY(0)}
#cam-viewer .shutter.top{top:0;transform-origin:top}#cam-viewer .shutter.bottom{bottom:0;transform-origin:bottom}
#cam-viewer.snap .shutter{animation:cam-shutter .32s ease-in-out}
@keyframes cam-shutter{50%{transform:scaleY(1)}}
#cam-viewer .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:4}
#cam-viewer.snap .flash{animation:cam-flash .7s ease-out .16s}
@keyframes cam-flash{0%{opacity:.95}100%{opacity:0}}
#cam-viewer figure{margin:0;max-width:min(88vw,1100px);cursor:zoom-in;transition:max-width .3s}
#cam-viewer img{display:block;width:100%;max-height:72vh;object-fit:contain;border:1px solid rgba(255,150,90,.4);border-radius:6px;
  box-shadow:0 0 40px rgba(255,120,50,.25);background:#000}
#cam-viewer .developing img{filter:brightness(2.4) saturate(0) blur(14px);opacity:.2}
#cam-viewer .revealed img{filter:none;opacity:1;transition:filter 2.6s ease-out,opacity 1.2s ease-out}
#cam-viewer.zoom figure{max-width:100vw;cursor:zoom-out}#cam-viewer.zoom img{max-height:100vh;border-radius:0}
#cam-viewer figcaption{display:flex;justify-content:space-between;gap:12px;margin-top:8px;flex-wrap:wrap}
#cam-viewer figcaption b{color:#ff9a5a;font-size:15px}
#cam-viewer .help{color:#9c7360;font-size:11px}
#cam-viewer.zoom figcaption{display:none}`;

function daysAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? t.today : t.daysAgo(d);
}

export async function createCameraSpots(roverObject) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const photos = await fetch(`${import.meta.env.BASE_URL}photos/photos.json`).then((r) => r.json());

  // --- Visor de fotos ---
  const viewer = document.createElement('div');
  viewer.id = 'cam-viewer';
  viewer.innerHTML = `<div class="shutter top"></div><div class="shutter bottom"></div><div class="flash"></div>
    <figure><img alt=""><figcaption><span><b></b> · <span class="when"></span></span>
    <span class="help">${t.photoHelp}</span></figcaption></figure>`;
  document.body.appendChild(viewer);
  const figure = viewer.querySelector('figure'), img = viewer.querySelector('img');
  const title = viewer.querySelector('b'), when = viewer.querySelector('.when');
  let current = null, index = 0;
  window.__cameras = { open: null, loaded: false };

  function show(key, i) {
    const list = photos[key];
    current = key;
    index = (i + list.length) % list.length;
    const p = list[index];
    viewer.classList.remove('snap', 'zoom');
    void viewer.offsetWidth; // reinicia las animaciones del obturador
    viewer.classList.add('open', 'snap');
    figure.className = 'developing';
    window.__cameras = { open: key, loaded: false };
    const [cameraName] = t.cameras[key];
    title.textContent = cameraName;
    when.textContent = `sol ${p.sol} · ${daysAgo(p.taken)} · ${p.credit}`;
    img.alt = t.photoAlt(cameraName, p.sol);
    img.onload = () => {
      // La foto “se revela” justo después del flash
      setTimeout(() => {
        figure.className = 'revealed';
        window.__cameras.loaded = true;
      }, 350);
    };
    img.src = `${import.meta.env.BASE_URL}${p.file}`;
  }

  function close() {
    viewer.classList.remove('open', 'snap', 'zoom');
    current = null;
    window.__cameras = { open: null, loaded: false };
  }

  figure.addEventListener('click', () => viewer.classList.toggle('zoom'));
  viewer.addEventListener('click', (e) => e.target === viewer && close());
  window.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(current, index + 1);
    else if (e.key === 'ArrowLeft') show(current, index - 1);
  });

  // --- Puntos que brillan sobre cada cámara ---
  const spots = CAMERAS.map((c) => {
    const part = roverObject.getObjectByName(c.node);
    const el = document.createElement('button');
    el.className = 'cam-spot';
    el.dataset.camera = c.key;
    const label = t.cameras[c.key].join(' · ');
    el.setAttribute('aria-label', label);
    el.innerHTML = `<span>${label}</span>`;
    el.addEventListener('click', () => show(c.key, 0));
    document.body.appendChild(el);
    return { el, part, box: new THREE.Box3(), pos: new THREE.Vector3() };
  });

  return {
    // Coloca cada punto en pantalla sobre el centro de su pieza
    update(camera) {
      const placed = [];
      for (const s of spots) {
        if (!s.part) continue;
        s.box.setFromObject(s.part).getCenter(s.pos).project(camera);
        const visible = s.pos.z < 1 && Math.abs(s.pos.x) < 1 && Math.abs(s.pos.y) < 1 && !current;
        s.el.style.display = visible ? '' : 'none';
        if (visible) {
          // Mastcam-Z y Navcam están juntas en el mástil: separa los puntos que se pisan
          const x = ((s.pos.x + 1) / 2) * innerWidth;
          let y = ((1 - s.pos.y) / 2) * innerHeight;
          while (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < SPOT_GAP)) y += SPOT_GAP;
          placed.push([x, y]);
          s.el.style.left = `${x}px`;
          s.el.style.top = `${y}px`;
        }
      }
    },
  };
}
