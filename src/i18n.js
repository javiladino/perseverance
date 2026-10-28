// Textos de la interfaz. Francés por defecto (instalación pensada para museos en Francia), español como alternativa.
// Idioma: ?lang=es|fr en la URL, si no el último elegido, si no francés.
const STRINGS = {
  fr: {
    missionTitle: 'CONTRÔLE DE MISSION · PERCY',
    noSignal: 'pas de signal',
    hideHint: 'T · masquer',
    nasaSource: 'NASA · trajets',
    liveSource: 'calculé en direct',
    distance: 'Distance parcourue',
    distanceMeaning: 'Tout ce que Percy a parcouru depuis son atterrissage.',
    elevation: 'Altitude du terrain',
    elevationMeaning: 'Altitude par rapport au « niveau de la mer » martien. Elle monte car Percy gravit le bord du cratère.',
    tilt: 'Inclinaison',
    tiltMeaning: 'De combien le rover penche à chaque arrêt. Plus il y a de degrés, plus le sol est pentu.',
    light: 'Temps-lumière Terre–Mars',
    lightMeaning: 'Le temps qu’un ordre envoyé depuis la Terre met pour atteindre Percy. C’est pour cela qu’il conduit seul.',
    cameras: {
      MASTCAM: ['Mastcam-Z', 'les yeux du mât'],
      NAVCAM: ['Navcam', 'pour naviguer'],
      HAZCAM: ['Hazcam avant', 'surveille les obstacles'],
      WATSON: ['WATSON', 'la loupe du bras'],
    },
    today: 'aujourd’hui',
    daysAgo: (d) => (d === 1 ? 'il y a 1 jour' : `il y a ${d} jours`),
    photoHelp: 'clic agrandir · ← → autres photos · Échap revenir',
    photoAlt: (camera, sol) => `Photo de ${camera}, sol ${sol}`,
  },
  es: {
    missionTitle: 'CONTROL DE MISIÓN · PERCY',
    noSignal: 'sin señal',
    hideHint: 'T · ocultar',
    nasaSource: 'NASA · manejos',
    liveSource: 'calculado en vivo',
    distance: 'Distancia recorrida',
    distanceMeaning: 'Todo lo que Percy ha rodado desde que aterrizó.',
    elevation: 'Altura del terreno',
    elevationMeaning: 'Altura respecto al “nivel del mar” de Marte. Sube porque escala el borde del cráter.',
    tilt: 'Inclinación',
    tiltMeaning: 'Cuánto se ladea el rover en cada parada. A más grados, más empinado el suelo.',
    light: 'Tiempo de luz Tierra–Marte',
    lightMeaning: 'Lo que tarda una orden nuestra en llegar a Percy. Por eso maneja solo.',
    cameras: {
      MASTCAM: ['Mastcam-Z', 'los ojos del mástil'],
      NAVCAM: ['Navcam', 'para navegar'],
      HAZCAM: ['Hazcam frontal', 'vigila obstáculos'],
      WATSON: ['WATSON', 'lupa del brazo'],
    },
    today: 'hoy',
    daysAgo: (d) => (d === 1 ? 'hace 1 día' : `hace ${d} días`),
    photoHelp: 'clic ampliar · ← → más fotos · Esc volver',
    photoAlt: (camera, sol) => `Foto de ${camera}, sol ${sol}`,
  },
};

export const LANGS = Object.keys(STRINGS);

function detect() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem('percy-lang');
    if (LANGS.includes(saved)) return saved;
  } catch {
    // almacenamiento bloqueado: se usa el idioma por defecto
  }
  return 'fr';
}

export const lang = detect();
export const t = STRINGS[lang];
document.documentElement.lang = lang;

// Cambiar de idioma recarga la página: todos los textos se construyen al arrancar
export function setLang(next) {
  try {
    localStorage.setItem('percy-lang', next);
  } catch {
    // sin almacenamiento, el parámetro de la URL basta
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  location.href = url.toString();
}
