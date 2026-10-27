select
    image_id, sol, camera_key, instrument, taken_at, received_at,
    width_px, height_px, is_color, is_large, is_full_frame,
    url_large, nasa_link, credit
from {{ ref('int_images_classified') }}
