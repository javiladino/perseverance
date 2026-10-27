"""Conexión de solo lectura al almacén para los cargadores de datos."""

import sys
from pathlib import Path

import duckdb

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "data"))


def connect():
    return duckdb.connect(str(REPO / "warehouse" / "percy.duckdb"), read_only=True)


def to_csv(sql: str):
    with connect() as con:
        con.sql(sql).write_csv("/dev/stdout")
