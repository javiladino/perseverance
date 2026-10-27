---
toc: false
---

# Percy · Plataforma de datos

<p class="lead">De la API de la NASA al juego: <code>dlt → DuckDB → dbt → Dagster</code>. Esta página se genera con los mismos marts que alimentan el control de misión del juego.</p>

```js
const kpis = FileAttachment("data/kpis.json").json();
const drives = FileAttachment("data/drives.csv").csv({typed: true});
const images = FileAttachment("data/images.csv").csv({typed: true});
const curation = FileAttachment("data/curation.csv").csv({typed: true});
const light = FileAttachment("data/light.csv").csv({typed: true});
const quality = FileAttachment("data/quality.json").json();
```

```js
const cameraColors = {domain: ["MASTCAM", "NAVCAM", "HAZCAM", "WATSON"], range: ["#c1440e", "#2f6f8f", "#8a6d3b", "#6b4c9a"]};
const fmt = (x, d = 0) => x.toLocaleString("es", {maximumFractionDigits: d});
const passed = quality.tests.filter((t) => t.status === "pass").length;
const curationByCamera = d3.rollups(curation, (v) => Object.fromEntries(v.map((d) => [d.decision, d.photos])), (d) => d.camera_key)
  .map(([camera_key, c]) => ({camera_key, approved: c.approved ?? 0, rejected: c.rejected ?? 0, pending: c.pending ?? 0}));
```

<div class="grid grid-cols-4">
  <div class="card"><h2>Distancia recorrida</h2><span class="big">${fmt(kpis.odometer_km, 2)} km</span><p>hasta el sol ${kpis.last_drive_sol}</p></div>
  <div class="card"><h2>Soles con manejo</h2><span class="big">${fmt(kpis.sols_with_driving)}</span><p>de ${fmt(kpis.last_drive_sol)} soles de misión</p></div>
  <div class="card"><h2>Tiempo de luz hoy</h2><span class="big">${fmt(kpis.light_minutes_now, 1)} min</span><p>entre ${fmt(kpis.light_minutes_min, 1)} y ${fmt(kpis.light_minutes_max, 1)} min en la misión</p></div>
  <div class="card"><h2>Calidad de datos</h2><span class="big">${passed}/${quality.tests.length}</span><p>tests de dbt en verde</p></div>
</div>

## El recorrido

<div class="grid grid-cols-2">
  <div class="card">${resize((width) => Plot.plot({
    title: "Ruta del rover en el cráter Jezero",
    subtitle: "Una parada confirmada por sol · color = altura",
    width, height: 360, aspectRatio: 1,
    x: {label: "Longitud (°)"}, y: {label: "Latitud (°)"},
    color: {scheme: "turbo", label: "Altura (m)", legend: true},
    marks: [
      Plot.line(drives, {x: "lon", y: "lat", stroke: "var(--theme-foreground-faint)"}),
      Plot.dot(drives, {x: "lon", y: "lat", fill: "elevation_m", r: 2.5, tip: true,
        channels: {Sol: "sol", "Distancia (km)": "odometer_km"}})
    ]
  }))}</div>
  <div class="card">${resize((width) => Plot.plot({
    title: "Distancia acumulada",
    subtitle: "Solo paradas confirmadas: las intermedias traen el odómetro a 0",
    width, height: 360,
    x: {label: "Sol"}, y: {label: "Distancia (km)", grid: true},
    marks: [
      Plot.areaY(drives, {x: "sol", y: "odometer_km", fill: "#c1440e", fillOpacity: 0.15}),
      Plot.lineY(drives, {x: "sol", y: "odometer_km", stroke: "#c1440e", tip: true}),
      Plot.ruleY([0])
    ]
  }))}</div>
</div>

<div class="grid grid-cols-2">
  <div class="card">${resize((width) => Plot.plot({
    title: "Metros recorridos por sol",
    width, height: 260,
    x: {label: "Sol"}, y: {label: "Metros", grid: true},
    marks: [Plot.rectY(drives, Plot.binX({y: "sum"}, {x: "sol", y: "driven_m", fill: "#c1440e", thresholds: 80, tip: true})), Plot.ruleY([0])]
  }))}</div>
  <div class="card">${resize((width) => Plot.plot({
    title: "Tiempo de luz Tierra–Marte",
    subtitle: "Calculado con las órbitas de ambos planetas (percy_pipeline/orbits.py)",
    width, height: 260,
    x: {label: "Sol"}, y: {label: "Minutos", grid: true},
    marks: [Plot.lineY(light, {x: "sol", y: "light_minutes", stroke: "#2f6f8f", tip: true})]
  }))}</div>
</div>

## Las cámaras

<div class="grid grid-cols-2">
  <div class="card">${resize((width) => Plot.plot({
    title: "Imágenes recibidas por sol y cámara",
    subtitle: "Ventana de la ingesta incremental (raw_images)",
    width, height: 300,
    x: {label: "Sol", tickFormat: "d"}, y: {label: "Imágenes", grid: true},
    color: {...cameraColors, legend: true},
    marks: [Plot.barY(images, {x: "sol", y: "images", fill: "camera_key", tip: true}), Plot.ruleY([0])]
  }))}</div>
  <div class="card">
    <h2>Curación de fotos para el juego</h2>
    <h3>Reglas automáticas de dbt (color, tamaño, fotograma completo) + decisión humana en el seed <code>photo_curation</code></h3>
    ${Inputs.table(curationByCamera, {
      columns: ["camera_key", "approved", "rejected", "pending"],
      header: {camera_key: "Cámara", approved: "En el juego", rejected: "Rechazadas", pending: "Por revisar"},
      format: {approved: (x) => html`<b style="color:#3a8a3a">${x}</b>`},
      select: false
    })}
  </div>
</div>

## Calidad de datos

<p>Última ejecución de <code>dbt build</code>: ${new Date(quality.generated_at).toLocaleString("es")}. En Dagster, cada test es un <em>asset check</em>.</p>

```js
Inputs.table(quality.tests, {
  columns: ["test", "status", "failures"],
  header: {test: "Test", status: "Estado", failures: "Filas que fallan"},
  sort: "status", rows: 12
})
```

<style>
.lead { font-size: 1.1rem; color: var(--theme-foreground-muted); max-width: 60ch; }
.big { font-size: 2rem; font-weight: 700; }
</style>
