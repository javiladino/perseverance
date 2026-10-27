"""Marts de DuckDB → archivos que consume el juego (public/)."""

import json
from pathlib import Path

import duckdb
import requests

from percy_pipeline.paths import PUBLIC_DIR, WAREHOUSE

PHOTOS_PER_CAMERA = 4
SERIES = {
    "distance": "odometer_km",
    "elevation": "elevation_m",
    "tilt": "tilt_deg",
}


def _connect(warehouse: Path):
    return duckdb.connect(str(warehouse), read_only=True)


def export_telemetry(warehouse: Path = WAREHOUSE, public: Path = PUBLIC_DIR) -> dict:
    """Series por sol para el control de misión: [[sol, valor], …]."""
    with _connect(warehouse) as con:
        rows = con.sql(f"select sol, {', '.join(SERIES.values())} from marts.fct_drives_by_sol order by sol")
        data = rows.fetchall()
    payload = {
        # Sin marca de hora de generación: el archivo solo cambia si cambian los datos
        "last_sol": data[-1][0],
        "source": "marts.fct_drives_by_sol (NASA M20_waypoints, solo paradas confirmadas)",
        "series": {key: [[r[0], round(float(r[i + 1]), 3)] for r in data] for i, key in enumerate(SERIES)},
    }
    out = public / "data" / "telemetry.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")))
    return {"path": str(out), "sols": len(data), "bytes": out.stat().st_size}


def export_photos(warehouse: Path = WAREHOUSE, public: Path = PUBLIC_DIR) -> dict:
    """Fotos aprobadas (las más recientes por cámara) + descarga de las que falten.

    Mantiene el esquema de public/photos/photos.json que lee src/cameras.js.
    """
    with _connect(warehouse) as con:
        rows = con.sql(f"""
            select camera_key, image_id, camera_name, instrument, sol, taken_at, credit, nasa_link, url_large
            from marts.mart_photo_candidates
            where decision = 'approved'
            qualify row_number() over (partition by camera_key order by taken_at desc, image_id) <= {PHOTOS_PER_CAMERA}
            order by camera_key, taken_at desc, image_id  -- desempate: fotos con la misma hora
        """).fetchall()

    photos_dir = public / "photos"
    photos_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list] = {}
    downloaded = 0
    for camera_key, image_id, name, instrument, sol, taken, credit, link, url in rows:
        target = photos_dir / f"{image_id}.jpg"
        if not target.exists():
            res = requests.get(url, timeout=60)
            res.raise_for_status()
            target.write_bytes(res.content)
            downloaded += 1
        manifest.setdefault(camera_key, []).append({
            "file": f"photos/{target.name}", "camera": name, "instrument": instrument, "sol": sol,
            "taken": taken.isoformat(timespec="milliseconds") + "Z", "credit": credit, "link": link,
        })

    # Solo se borran fotos que gestiona el pipeline y ya no están aprobadas
    keep = {Path(p["file"]).name for v in manifest.values() for p in v}
    removed = [f.name for f in photos_dir.glob("*.jpg") if f.name not in keep]
    for name in removed:
        (photos_dir / name).unlink()

    (photos_dir / "photos.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    return {"cameras": {k: len(v) for k, v in manifest.items()}, "downloaded": downloaded, "removed": removed}


if __name__ == "__main__":
    print(export_telemetry())
    print(export_photos())
