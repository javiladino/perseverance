from _warehouse import to_csv

to_csv("select sol, odometer_km, driven_m, elevation_m, tilt_deg, lat, lon from marts.fct_drives_by_sol order by sol")
