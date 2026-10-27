// Proveedores de telemetría de Percy

// Series por sol ya modeladas por la plataforma de datos (data/: dlt → DuckDB → dbt):
// el mart fct_drives_by_sol exportado por data/percy_pipeline/export.py
const TELEMETRY_URL = `${import.meta.env.BASE_URL}data/telemetry.json`;

// Historial de manejos de la NASA: un punto por sol con movimiento
export function createWaypointsProvider() {
  let loading = null;
  const load = () =>
    (loading ??= fetch(TELEMETRY_URL).then((r) => {
      if (!r.ok) throw new Error(`Telemetría HTTP ${r.status}`);
      return r.json();
    }));

  return {
    async request(key) {
      const { series } = await load();
      return series[key].map(([x, y]) => ({ x, y }));
    },
  };
}

// --- Tiempo de luz Tierra–Marte ---
// Elementos orbitales aproximados de JPL (Standish, válidos 1800–2050)
const ELEMENTS = {
  earth: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668,
    100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  mars: [1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131,
    -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
};
const DEG = Math.PI / 180;
const AU_KM = 149597870.7;
const C_KM_S = 299792.458;

function heliocentric(el, T) {
  const [a0, a1, e0, e1, i0, i1, L0, L1, w0, w1, O0, O1] = el;
  const a = a0 + a1 * T, e = e0 + e1 * T, I = (i0 + i1 * T) * DEG;
  const L = L0 + L1 * T, varpi = w0 + w1 * T, Omega = O0 + O1 * T;
  const omega = (varpi - Omega) * DEG;
  const M = (((L - varpi) % 360) + 360) % 360 * DEG;
  let E = M;
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const O = Omega * DEG;
  const cw = Math.cos(omega), sw = Math.sin(omega), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    sw * sI * xp + cw * sI * yp,
  ];
}

// Minutos que tarda la luz (y la radio) entre la Tierra y Marte en una fecha
export function lightMinutes(date) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545) / 36525;
  const e = heliocentric(ELEMENTS.earth, T), m = heliocentric(ELEMENTS.mars, T);
  const au = Math.hypot(m[0] - e[0], m[1] - e[1], m[2] - e[2]);
  return (au * AU_KM) / C_KM_S / 60;
}

// Aterrizaje (sol 0) y duración de un sol en segundos
const LANDING = Date.UTC(2021, 1, 18, 20, 55);
const SOL_S = 88775.244;
export const solAt = (date) => (date.getTime() - LANDING) / 1000 / SOL_S;

export function createLightTimeProvider() {
  return {
    async request() {
      const now = solAt(new Date());
      const out = [];
      for (let s = 0; s < now; s += 5) out.push({ x: s, y: lightMinutes(new Date(LANDING + s * SOL_S * 1000)) });
      out.push({ x: now, y: lightMinutes(new Date()) });
      return out;
    },
    subscribe(_key, callback) {
      const tick = () => {
        const d = new Date();
        callback({ x: solAt(d), y: lightMinutes(d) });
      };
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    },
  };
}
