select
    sol::int            as sol,
    utc::timestamptz    as at_utc,
    earth_mars_km,
    light_minutes
from {{ source('nasa', 'light_time') }}
