// Mini TelemetryAPI con el patrón de Open MCT (src/api/telemetry/TelemetryAPI.js):
// cada dato declara su metadato (nombre, unidad) y un proveedor que sabe
// devolver el historial (request) y avisar de valores nuevos (subscribe).
export function createTelemetry() {
  const points = new Map(); // key -> { key, name, unit, meaning, provider }

  return {
    addPoint(meta, provider) {
      points.set(meta.key, { ...meta, provider });
    },
    getMetadata(key) {
      return points.get(key);
    },
    list() {
      return [...points.values()];
    },
    // Historial completo: [{ x, y }] ordenado por x
    request(key) {
      return points.get(key).provider.request(key);
    },
    // Devuelve la función para cancelar, como en Open MCT
    subscribe(key, callback) {
      const { provider } = points.get(key);
      return provider.subscribe ? provider.subscribe(key, callback) : () => {};
    },
  };
}
