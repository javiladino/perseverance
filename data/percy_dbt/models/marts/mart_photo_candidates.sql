-- Fotos que pasan las reglas automáticas + la decisión humana del seed photo_curation
with candidates as (
    select * from {{ ref('int_images_classified') }}
    where is_color and is_large and is_full_frame
)

select
    c.image_id,
    c.camera_key,
    c.camera_name,
    c.instrument,
    c.sol,
    c.taken_at,
    c.url_large,
    c.nasa_link,
    c.credit,
    coalesce(p.decision, 'pending')  as decision,
    p.reason
from candidates c
left join {{ ref('photo_curation') }} p using (image_id)
