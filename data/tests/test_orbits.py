from datetime import UTC, datetime

import pytest

from percy_pipeline.orbits import LANDING, light_minutes, light_time_by_sol, sol_at

# Valores de referencia calculados con lightMinutes() de src/providers.js (el juego)
JS_REFERENCE = [
    ("2021-02-18T20:55:00Z", 11.370406),  # aterrizaje
    ("2023-11-18T00:00:00Z", 21.012168),  # conjunción solar: máxima distancia
    ("2026-10-27T00:00:00Z", 12.247270),
]


@pytest.mark.parametrize(("iso", "expected"), JS_REFERENCE)
def test_light_minutes_matches_game(iso, expected):
    when = datetime.fromisoformat(iso)
    assert light_minutes(when) == pytest.approx(expected, abs=0.01)


def test_light_time_physical_range():
    rows = list(light_time_by_sol(datetime(2026, 10, 27, tzinfo=UTC)))
    assert rows[0]["sol"] == 0 and rows[0]["utc"] == LANDING
    # La luz tarda entre ~3 y ~22 minutos entre la Tierra y Marte
    assert all(3 < r["light_minutes"] < 22.5 for r in rows)


def test_sol_at_landing_is_zero():
    assert sol_at(LANDING) == 0
