"""Resultado de los tests de dbt de la última ejecución (target/run_results.json)."""

import json

from _warehouse import REPO

results = json.loads((REPO / "data" / "percy_dbt" / "target" / "run_results.json").read_text())
tests = [
    {"test": r["unique_id"].split(".")[2], "status": r["status"], "failures": r.get("failures") or 0}
    for r in results["results"]
    if r["unique_id"].startswith("test.")
]
print(json.dumps({"generated_at": results["metadata"]["generated_at"], "tests": tests}))
