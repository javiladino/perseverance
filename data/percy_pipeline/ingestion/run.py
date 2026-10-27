import dlt

from percy_pipeline.ingestion.nasa import nasa_source
from percy_pipeline.paths import WAREHOUSE


def make_pipeline():
    WAREHOUSE.parent.mkdir(parents=True, exist_ok=True)
    return dlt.pipeline(
        pipeline_name="percy",
        destination=dlt.destinations.duckdb(str(WAREHOUSE)),
        dataset_name="raw",
    )


if __name__ == "__main__":
    print(make_pipeline().run(nasa_source()))
