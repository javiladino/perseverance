select
    rmc                                   as stop_id,
    site,
    drive,
    sol::int                              as sol,
    final = 'y'                           as is_final,  -- 'm'/'i': posiciones intermedias sin odómetro
    lat,
    lon,
    elev_geoid                            as elevation_m,
    dist_m                                as drive_m,
    dist_total_m                          as odometer_m,
    tilt                                  as tilt_deg,
    roll                                  as roll_deg,
    pitch                                 as pitch_deg,
    yaw                                   as yaw_deg,
    note
from {{ source('nasa', 'waypoints') }}
