-- El juego necesita al menos una foto aprobada por cámara
select camera_key
from {{ ref('dim_cameras') }}
where camera_key not in (select camera_key from {{ ref('photo_curation') }} p
                         join {{ ref('stg_raw_images') }} using (image_id)
                         join {{ ref('cameras') }} using (instrument)
                         where p.decision = 'approved')
