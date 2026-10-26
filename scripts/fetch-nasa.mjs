// npm run datos:nasa: descarga el historial de manejos de Percy a public/data/
// para que el juego lo lea desde nuestro propio servidor.
import { mkdir, writeFile } from 'node:fs/promises';

const URL = 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json';
const OUT = new globalThis.URL('../public/data/M20_waypoints.json', import.meta.url);

const res = await fetch(URL);
if (!res.ok) throw new Error(`NASA respondió ${res.status}`);
const json = await res.json();
const last = json.features.at(-1).properties;
await mkdir(new globalThis.URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(json));
console.log(`${json.features.length} paradas guardadas, hasta el sol ${last.sol} (${(last.dist_total_m / 1000).toFixed(2)} km)`);
