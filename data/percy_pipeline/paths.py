from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = DATA_DIR.parent
WAREHOUSE = REPO_DIR / "warehouse" / "percy.duckdb"
DBT_DIR = DATA_DIR / "percy_dbt"
PUBLIC_DIR = REPO_DIR / "public"
