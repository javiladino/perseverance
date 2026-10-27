"""Fuentes dlt: historial de manejos, imágenes sin procesar de la NASA y tiempo de luz."""

from datetime import UTC, datetime, timedelta

import dlt
import requests

from percy_pipeline.orbits import light_time_by_sol

WAYPOINTS_URL = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json"
RAW_IMAGES_URL = "https://mars.nasa.gov/rss/api/"

# Instrumentos de las 4 cámaras del juego (dbt los agrupa con el seed cameras.csv)
INSTRUMENTS = [
    "MCZ_LEFT", "MCZ_RIGHT",
    "NAVCAM_LEFT", "NAVCAM_RIGHT",
    "FRONT_HAZCAM_LEFT_A", "FRONT_HAZCAM_RIGHT_A",
    "SHERLOC_WATSON",
]
PAGE_SIZE = 100
MAX_PAGES = 20  # tope de seguridad por instrumento y ejecución


@dlt.resource(name="waypoints", write_disposition="replace", primary_key="rmc")
def waypoints():
    """Una fila por parada del rover. Es un archivo pequeño: se reemplaza entero."""
    res = requests.get(WAYPOINTS_URL, timeout=60)
    res.raise_for_status()
    for feature in res.json()["features"]:
        props = dict(feature["properties"])
        props.pop("images", None)  # panorámicas: fuera del alcance
        yield props


def _default_since() -> str:
    return (datetime.now(UTC) - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")


@dlt.resource(name="raw_images", write_disposition="merge", primary_key="imageid")
def raw_images(
    # Idioma de dlt: el cursor incremental se declara como valor por defecto
    date_received=dlt.sources.incremental("date_received", initial_value=_default_since()),  # noqa: B008
):
    """Imágenes por instrumento, de la más nueva a la más vieja, hasta el cursor."""
    since = date_received.last_value
    for instrument in INSTRUMENTS:
        for page in range(MAX_PAGES):
            res = requests.get(RAW_IMAGES_URL, timeout=60, params={
                "feed": "raw_images", "category": "mars2020", "feedtype": "json", "ver": "1.2",
                "num": PAGE_SIZE, "page": page, "order": "sol desc", "search": f"|{instrument}|",
            })
            res.raise_for_status()
            images = res.json()["images"]
            yield images
            if len(images) < PAGE_SIZE or min(i["date_received"] for i in images) < since:
                break


@dlt.resource(name="light_time", write_disposition="replace", primary_key="sol")
def light_time():
    yield from light_time_by_sol()


@dlt.source(name="nasa")
def nasa_source():
    return waypoints, raw_images, light_time
