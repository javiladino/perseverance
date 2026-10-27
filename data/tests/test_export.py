import json

import duckdb
import pytest

from percy_pipeline.export import export_photos, export_telemetry


@pytest.fixture
def warehouse(tmp_path):
    path = tmp_path / "w.duckdb"
    con = duckdb.connect(str(path))
    con.sql("create schema marts")
    con.sql("""create table marts.fct_drives_by_sol as
               select * from (values (13, 0.0, -2569.9, 1.18), (14, 0.006, -2569.86, 1.01))
               t(sol, odometer_km, elevation_m, tilt_deg)""")
    con.sql("""create table marts.mart_photo_candidates as
               select * from (values
                 ('MASTCAM', 'ZL0_A', 'Mastcam-Z', 'MCZ_LEFT', 2020, timestamp '2026-10-26 05:00:00', 'NASA', 'l', 'u', 'approved'),
                 ('MASTCAM', 'ZL0_B', 'Mastcam-Z', 'MCZ_LEFT', 2019, timestamp '2026-10-25 05:00:00', 'NASA', 'l', 'u', 'pending'))
               t(camera_key, image_id, camera_name, instrument, sol, taken_at, credit, nasa_link, url_large, decision)""")
    con.close()
    return path


def test_telemetry_contract(warehouse, tmp_path):
    export_telemetry(warehouse, tmp_path)
    payload = json.loads((tmp_path / "data" / "telemetry.json").read_text())
    assert payload["last_sol"] == 14
    assert payload["series"]["distance"] == [[13, 0.0], [14, 0.006]]
    assert set(payload["series"]) == {"distance", "elevation", "tilt"}


def test_photos_only_approved_and_cleans_up(warehouse, tmp_path):
    photos = tmp_path / "photos"
    photos.mkdir()
    (photos / "ZL0_A.jpg").write_bytes(b"jpg")  # ya descargada: no hay red
    (photos / "OLD.jpg").write_bytes(b"jpg")    # ya no aprobada: se borra
    result = export_photos(warehouse, tmp_path)
    manifest = json.loads((photos / "photos.json").read_text())
    assert [p["file"] for p in manifest["MASTCAM"]] == ["photos/ZL0_A.jpg"]
    assert manifest["MASTCAM"][0]["taken"] == "2026-10-26T05:00:00.000Z"
    assert result["removed"] == ["OLD.jpg"] and not (photos / "OLD.jpg").exists()
