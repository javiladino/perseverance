// La página del dashboard, compartida por los dos idiomas: recibe los textos y los datos
import * as Plot from "npm:@observablehq/plot";
import * as Inputs from "npm:@observablehq/inputs";
import {html} from "npm:htl";
import {resize} from "npm:@observablehq/stdlib";
import * as d3 from "npm:d3";

const CAMERA_COLORS = {domain: ["MASTCAM", "NAVCAM", "HAZCAM", "WATSON"], range: ["#c1440e", "#2f6f8f", "#8a6d3b", "#6b4c9a"]};
const raw = (s) => Object.assign(document.createElement("span"), {innerHTML: s});

export function missionPage(t, {kpis, drives, images, curation, light, quality}) {
  const fmt = (x, d = 0) => x.toLocaleString(t.locale, {maximumFractionDigits: d});
  const tick = (x) => x.toLocaleString(t.locale); // ejes con el formato del idioma (2 000 / 2.000)
  const passed = quality.tests.filter((x) => x.status === "pass").length;
  const curationByCamera = d3.rollups(curation, (v) => Object.fromEntries(v.map((d) => [d.decision, d.photos])), (d) => d.camera_key)
    .map(([camera_key, c]) => ({camera_key, approved: c.approved ?? 0, rejected: c.rejected ?? 0, pending: c.pending ?? 0}));

  return html`
  <nav class="lang"><a href="${t.other.href}">${t.other.label}</a></nav>
  <h1>${t.title}</h1>
  <p class="lead">${raw(t.lead)}</p>
  <p><a class="play" href="../${t.locale === "fr" ? "" : "../"}?lang=${t.locale}">🎮 ${t.play}</a></p>

  <div class="grid grid-cols-4">
    <div class="card"><h2>${t.distance}</h2><span class="big">${fmt(kpis.odometer_km, 2)} km</span><p>${t.untilSol(kpis.last_drive_sol)}</p></div>
    <div class="card"><h2>${t.sols}</h2><span class="big">${fmt(kpis.sols_with_driving)}</span><p>${t.ofSols(fmt(kpis.last_drive_sol))}</p></div>
    <div class="card"><h2>${t.lightNow}</h2><span class="big">${fmt(kpis.light_minutes_now, 1)} min</span><p>${t.lightRange(fmt(kpis.light_minutes_min, 1), fmt(kpis.light_minutes_max, 1))}</p></div>
    <div class="card"><h2>${t.quality}</h2><span class="big">${passed}/${quality.tests.length}</span><p>${t.qualitySub}</p></div>
  </div>

  <h2 class="section">${t.route}</h2>
  <div class="grid grid-cols-2">
    <div class="card">${resize((width) => Plot.plot({
      title: t.mapTitle, subtitle: t.mapSub, width, height: 360,
      x: {label: t.lon, tickFormat: tick}, y: {label: t.lat, tickFormat: tick},
      color: {scheme: "turbo", label: t.alt, legend: true, tickFormat: tick},
      marks: [
        Plot.line(drives, {x: "lon", y: "lat", stroke: "var(--theme-foreground-faint)"}),
        Plot.dot(drives, {x: "lon", y: "lat", fill: "elevation_m", r: 2.5, tip: true, channels: {Sol: "sol", [t.km]: "odometer_km"}})
      ]
    }))}</div>
    <div class="card">${resize((width) => Plot.plot({
      title: t.odoTitle, subtitle: t.odoSub, width, height: 360,
      x: {label: "Sol", tickFormat: tick}, y: {label: t.km, grid: true, tickFormat: tick},
      marks: [
        Plot.areaY(drives, {x: "sol", y: "odometer_km", fill: "#c1440e", fillOpacity: 0.15}),
        Plot.lineY(drives, {x: "sol", y: "odometer_km", stroke: "#c1440e", tip: true}),
        Plot.ruleY([0])
      ]
    }))}</div>
  </div>
  <div class="grid grid-cols-2">
    <div class="card">${resize((width) => Plot.plot({
      title: t.metersTitle, width, height: 260,
      x: {label: "Sol", tickFormat: tick}, y: {label: t.meters, grid: true, tickFormat: tick},
      marks: [Plot.rectY(drives, Plot.binX({y: "sum"}, {x: "sol", y: "driven_m", fill: "#c1440e", thresholds: 80, tip: true})), Plot.ruleY([0])]
    }))}</div>
    <div class="card">${resize((width) => Plot.plot({
      title: t.lightTitle, subtitle: t.lightSub, width, height: 260,
      x: {label: "Sol", tickFormat: tick}, y: {label: t.minutes, grid: true},
      marks: [Plot.lineY(light, {x: "sol", y: "light_minutes", stroke: "#2f6f8f", tip: true})]
    }))}</div>
  </div>

  <h2 class="section">${t.cameras}</h2>
  <div class="grid grid-cols-2">
    <div class="card">${resize((width) => Plot.plot({
      title: t.imagesTitle, subtitle: t.imagesSub, width, height: 300,
      x: {label: "Sol", tickFormat: "d"}, y: {label: t.images, grid: true},
      color: {...CAMERA_COLORS, legend: true},
      marks: [Plot.barY(images, {x: "sol", y: "images", fill: "camera_key", tip: true}), Plot.ruleY([0])]
    }))}</div>
    <div class="card">
      <h2>${t.curationTitle}</h2>
      <h3>${raw(t.curationSub)}</h3>
      ${Inputs.table(curationByCamera, {
        columns: ["camera_key", "approved", "rejected", "pending"], header: t.curationHeader,
        format: {approved: (x) => html`<b style="color:#3a8a3a">${x}</b>`}, select: false
      })}
    </div>
  </div>

  <h2 class="section">${t.qualityTitle}</h2>
  <p>${raw(t.lastRun(new Date(quality.generated_at).toLocaleString(t.locale)))}</p>
  ${Inputs.table(quality.tests, {columns: ["test", "status", "failures"], header: t.testsHeader, sort: "status", rows: 12})}`;
}
