-- Estado del rover al final de cada sol en el que se movió (solo paradas confirmadas)
with final_stops as (
    select * from {{ ref('stg_waypoints') }} where is_final
),

last_stop_of_sol as (
    select *, row_number() over (partition by sol order by site desc, drive desc) as rn
    from final_stops
)

select
    sol,
    stop_id,
    odometer_m,
    odometer_m / 1000                                           as odometer_km,
    odometer_m - lag(odometer_m, 1, 0) over (order by sol)      as driven_m,
    elevation_m,
    tilt_deg,
    lat,
    lon
from last_stop_of_sol
where rn = 1
