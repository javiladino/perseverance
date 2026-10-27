select
    imageid                                                     as image_id,
    sol::int                                                    as sol,
    camera__instrument                                          as instrument,
    camera__filter_name                                         as filter_name,
    sample_type,
    -- Claves del identificador de NASA: 3.ª letra (filtro / color) y código de producto
    substr(imageid, 3, 1)                                       as id_filter_code,
    regexp_extract(imageid, '_\d{3}([A-Z]{3})_', 1)             as product_code,
    regexp_extract(extended__dimension, '\((\d+),', 1)::int     as width_px,
    regexp_extract(extended__dimension, ',(\d+)\)', 1)::int     as height_px,
    date_taken_utc::timestamp                                   as taken_at,
    date_received::timestamptz                                  as received_at,
    image_files__large                                          as url_large,
    image_files__small                                          as url_small,
    link                                                        as nasa_link,
    credit,
    title
from {{ source('nasa', 'raw_images') }}
