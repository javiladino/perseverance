"""Dagster: de la NASA al juego como un grafo de assets con linaje, checks y schedule."""

import json
import os

import dagster as dg
from dagster_dbt import DbtCliResource, DbtProject, dbt_assets, get_asset_key_for_model

from percy_pipeline import export
from percy_pipeline.ingestion.nasa import nasa_source
from percy_pipeline.ingestion.run import make_pipeline
from percy_pipeline.paths import DBT_DIR, PUBLIC_DIR, WAREHOUSE

# dbt lee la ruta del almacén de esta variable (percy_dbt/profiles.yml)
os.environ.setdefault("PERCY_WAREHOUSE", str(WAREHOUSE))

dbt_project = DbtProject(project_dir=DBT_DIR, profiles_dir=DBT_DIR)
dbt_project.prepare_if_dev()


# --- Ingesta: las claves coinciden con las fuentes de dbt (source "nasa") ---
@dg.multi_asset(
    specs=[
        dg.AssetSpec(["nasa", "waypoints"], description="Historial de manejos (reemplazo total)."),
        dg.AssetSpec(["nasa", "raw_images"], description="Imágenes sin procesar (incremental por date_received)."),
        dg.AssetSpec(["nasa", "light_time"], description="Tiempo de luz Tierra–Marte por sol."),
    ],
    group_name="ingestion",
    compute_kind="dlt",
)
def nasa_raw(context: dg.AssetExecutionContext):
    pipeline = make_pipeline()
    pipeline.run(nasa_source())
    rows = pipeline.last_trace.last_normalize_info.row_counts
    for table in ("waypoints", "raw_images", "light_time"):
        yield dg.MaterializeResult(
            asset_key=["nasa", table],
            metadata={"rows_loaded": rows.get(table, 0)},  # 0 en raw_images = nada nuevo
        )


# --- Transformación: modelos y tests de dbt (los tests aparecen como asset checks) ---
@dbt_assets(manifest=dbt_project.manifest_path)
def percy_dbt(context: dg.AssetExecutionContext, dbt: DbtCliResource):
    yield from dbt.cli(["build"], context=context).stream()


def _dbt_key(model: str) -> dg.AssetKey:
    # dagster-dbt antepone el esquema (marts/…): se resuelve desde el manifest, no a mano
    return get_asset_key_for_model([percy_dbt], model)


# --- Consumo: los archivos que lee el juego ---
@dg.asset(deps=[_dbt_key("fct_drives_by_sol")], group_name="game", compute_kind="json")
def game_telemetry() -> dg.MaterializeResult:
    """public/data/telemetry.json para el control de misión."""
    return dg.MaterializeResult(metadata=export.export_telemetry())


@dg.asset(deps=[_dbt_key("mart_photo_candidates")], group_name="game", compute_kind="json")
def game_photos() -> dg.MaterializeResult:
    """Fotos aprobadas en public/photos/ y su photos.json para las cámaras."""
    result = export.export_photos()
    return dg.MaterializeResult(metadata={
        "cameras": dg.MetadataValue.json(result["cameras"]),
        "downloaded": result["downloaded"],
        "removed": len(result["removed"]),
    })


@dg.asset_check(asset=game_telemetry, blocking=True)
def telemetry_contract() -> dg.AssetCheckResult:
    """El juego espera tres series no vacías y un archivo ligero."""
    path = PUBLIC_DIR / "data" / "telemetry.json"
    series = json.loads(path.read_text())["series"]
    size_kb = path.stat().st_size / 1024
    ok = set(series) == {"distance", "elevation", "tilt"} and all(series.values()) and size_kb < 100
    return dg.AssetCheckResult(passed=ok, metadata={"size_kb": round(size_kb, 1)})


@dg.asset_check(asset=game_photos, blocking=True)
def photos_for_every_camera() -> dg.AssetCheckResult:
    manifest = json.loads((PUBLIC_DIR / "photos" / "photos.json").read_text())
    counts = {k: len(manifest.get(k, [])) for k in ("MASTCAM", "NAVCAM", "HAZCAM", "WATSON")}
    return dg.AssetCheckResult(passed=all(counts.values()), metadata={"photos": dg.MetadataValue.json(counts)})


daily_refresh = dg.ScheduleDefinition(
    name="daily_refresh",
    target=dg.AssetSelection.all(),
    cron_schedule="0 6 * * *",  # cada día a las 06:00 UTC, tras la bajada nocturna de NASA
    execution_timezone="UTC",
)

defs = dg.Definitions(
    assets=[nasa_raw, percy_dbt, game_telemetry, game_photos],
    asset_checks=[telemetry_contract, photos_for_every_camera],
    schedules=[daily_refresh],
    resources={"dbt": DbtCliResource(project_dir=dbt_project)},
)
