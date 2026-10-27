with drives as (select * from {{ ref('fct_drives_by_sol') }}),
     light as (select * from {{ ref('stg_light_time') }}),
     images as (select * from {{ ref('fct_images') }})

select
    (select max(sol) from drives)                                    as last_drive_sol,
    (select max(odometer_km) from drives)                            as odometer_km,
    (select count(*) from drives where driven_m > 0)                 as sols_with_driving,
    (select max(elevation_m) - min(elevation_m) from drives)         as elevation_gain_m,
    (select max(tilt_deg) from drives)                               as max_tilt_deg,
    (select light_minutes from light order by sol desc limit 1)      as light_minutes_now,
    (select min(light_minutes) from light)                           as light_minutes_min,
    (select max(light_minutes) from light)                           as light_minutes_max,
    (select count(*) from images)                                    as images_loaded,
    (select max(received_at) from images)                            as last_image_received_at
