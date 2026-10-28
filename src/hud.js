// Control de misión sobre la escena: una tarjeta por dato, con valor,
// gráfica de toda la misión y una frase simple. La tecla T lo oculta.
const CSS = `
#mission{position:fixed;top:16px;right:16px;width:300px;max-height:calc(100% - 32px);overflow:auto;
  font:13px/1.4 ui-monospace,Menlo,monospace;color:#ffe2c6;background:rgba(30,14,8,.72);
  border:1px solid rgba(255,150,90,.35);border-radius:10px;padding:12px;backdrop-filter:blur(6px);
  box-shadow:0 0 24px rgba(255,110,40,.15);transition:opacity .25s,transform .25s}
#mission.hidden{opacity:0;transform:translateX(20px);pointer-events:none}
#mission .lang{position:absolute;top:10px;right:12px;display:flex;gap:2px}
#mission .lang button{font:inherit;font-size:10px;color:#9c7360;background:none;border:1px solid transparent;border-radius:4px;padding:1px 5px;cursor:pointer}
#mission .lang button[aria-pressed=true]{color:#ffe2c6;border-color:rgba(255,150,90,.45)}
#mission h1{margin:0 0 8px;padding-right:58px;font-size:12px;letter-spacing:.18em;color:#ff9a5a}
#mission .card{border-top:1px solid rgba(255,150,90,.2);padding:8px 0}
#mission .name{color:#d9a888;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
#mission .src{float:right;color:#9c7360;font-size:10px}
#mission .val{font-size:20px;color:#fff;margin:2px 0}
#mission .val small{font-size:12px;color:#d9a888}
#mission canvas{width:100%;height:42px;display:block}
#mission .meaning{color:#c99b80;font-size:11px}
#mission .hint{margin-top:6px;color:#9c7360;font-size:10px;text-align:right}
@media (max-width:600px){#mission{left:16px;width:auto;top:auto;bottom:16px;max-height:45%}}`;

function drawChart(canvas, data) {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = (canvas.width = canvas.clientWidth * dpr), h = (canvas.height = canvas.clientHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (data.length < 2) return;
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const px = (x) => ((x - x0) / (x1 - x0 || 1)) * (w - 4) + 2;
  const py = (y) => h - 3 - ((y - y0) / (y1 - y0 || 1)) * (h - 6);
  ctx.strokeStyle = '#ff8c4a';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  data.forEach((d, i) => (i ? ctx.lineTo(px(d.x), py(d.y)) : ctx.moveTo(px(d.x), py(d.y))));
  ctx.stroke();
  const last = data[data.length - 1];
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px(last.x), py(last.y), 2.5 * dpr, 0, Math.PI * 2);
  ctx.fill();
}

import { lang, LANGS, setLang, t } from './i18n.js';

export function createMissionControl(telemetry) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('aside');
  root.id = 'mission';
  root.innerHTML = `<h1>${t.missionTitle}</h1><nav class="lang">${LANGS.map((l) =>
    `<button data-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('')}</nav>`;
  root.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => b.dataset.lang !== lang && setLang(b.dataset.lang)));
  document.body.appendChild(root);

  const status = {}; // key -> 'cargando' | 'ok' | 'error'; lo lee npm run check
  window.__mission = { status, values: {} };

  for (const meta of telemetry.list()) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.key = meta.key;
    card.innerHTML = `<span class="src">${meta.source}</span><div class="name">${meta.name}</div>
      <div class="val">…</div><canvas></canvas><div class="meaning">${meta.meaning}</div>`;
    root.appendChild(card);
    const val = card.querySelector('.val'), canvas = card.querySelector('canvas');
    let data = [];
    const show = (d) => {
      val.innerHTML = `${d.y.toLocaleString(lang, { maximumFractionDigits: meta.digits })} <small>${meta.unit}</small>`;
      window.__mission.values[meta.key] = d.y;
    };

    status[meta.key] = 'cargando';
    telemetry
      .request(meta.key)
      .then((hist) => {
        data = hist;
        show(data[data.length - 1]);
        drawChart(canvas, data);
        status[meta.key] = 'ok';
        telemetry.subscribe(meta.key, (d) => {
          data[data.length - 1] = d;
          show(d);
        });
      })
      .catch((err) => {
        status[meta.key] = 'error';
        val.textContent = t.noSignal;
        console.warn(`Telemetría ${meta.key}:`, err);
      });
  }

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = t.hideHint;
  root.appendChild(hint);

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && !e.repeat) root.classList.toggle('hidden');
  });
  return root;
}
