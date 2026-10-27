from _warehouse import to_csv

to_csv("select sol, light_minutes, earth_mars_km from staging.stg_light_time order by sol")
