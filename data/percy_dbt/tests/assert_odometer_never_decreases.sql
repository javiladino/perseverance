-- El odómetro de las paradas confirmadas nunca puede bajar
select *
from (
    select sol, odometer_m, odometer_m - lag(odometer_m) over (order by sol) as delta
    from {{ ref('fct_drives_by_sol') }}
)
where delta < 0
