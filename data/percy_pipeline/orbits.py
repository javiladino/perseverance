"""Tiempo de luz Tierra–Marte. Mismo cálculo que lightMinutes() en src/providers.js."""

import math
from datetime import UTC, datetime, timedelta

# Elementos orbitales aproximados de JPL (Standish, válidos 1800–2050):
# a, ȧ, e, ė, I, İ, L, L̇, ϖ, ϖ̇, Ω, Ω̇ (por siglo juliano desde J2000)
ELEMENTS = {
    "earth": (1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668,
              100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0),
    "mars": (1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131,
             -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343),
}
AU_KM = 149_597_870.7
C_KM_S = 299_792.458

# Aterrizaje de Perseverance (sol 0) y duración de un sol
LANDING = datetime(2021, 2, 18, 20, 55, tzinfo=UTC)
SOL_S = 88_775.244


def _heliocentric(el, T):
    a0, a1, e0, e1, i0, i1, L0, L1, w0, w1, O0, O1 = el
    a, e, inc = a0 + a1 * T, e0 + e1 * T, math.radians(i0 + i1 * T)
    L, varpi, Omega = L0 + L1 * T, w0 + w1 * T, O0 + O1 * T
    omega = math.radians(varpi - Omega)
    M = math.radians((L - varpi) % 360)
    E = M
    for _ in range(6):
        E -= (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
    xp, yp = a * (math.cos(E) - e), a * math.sqrt(1 - e * e) * math.sin(E)
    O = math.radians(Omega)
    cw, sw, cO, sO, cI, sI = math.cos(omega), math.sin(omega), math.cos(O), math.sin(O), math.cos(inc), math.sin(inc)
    return (
        (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
        (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
        sw * sI * xp + cw * sI * yp,
    )


def earth_mars_km(when: datetime) -> float:
    jd = when.timestamp() / 86400 + 2440587.5
    T = (jd - 2451545) / 36525
    e, m = _heliocentric(ELEMENTS["earth"], T), _heliocentric(ELEMENTS["mars"], T)
    return math.dist(e, m) * AU_KM


def light_minutes(when: datetime) -> float:
    return earth_mars_km(when) / C_KM_S / 60


def sol_at(when: datetime) -> float:
    return (when - LANDING).total_seconds() / SOL_S


def light_time_by_sol(until: datetime | None = None):
    """Una fila por sol desde el aterrizaje hasta `until` (por defecto, ahora)."""
    until = until or datetime.now(UTC)
    for sol in range(int(sol_at(until)) + 1):
        when = LANDING + timedelta(seconds=sol * SOL_S)
        km = earth_mars_km(when)
        yield {"sol": sol, "utc": when, "earth_mars_km": km, "light_minutes": km / C_KM_S / 60}
