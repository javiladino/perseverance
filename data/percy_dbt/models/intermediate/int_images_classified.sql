-- Reglas que antes aplicaba a mano mirando la hoja de contactos
with images as (
    select i.*, c.camera_key, c.camera_name
    from {{ ref('stg_raw_images') }} i
    join {{ ref('cameras') }} c using (instrument)
)

select
    *,
    case
        -- Mastcam-Z: filtro 0 (RGB) y producto EBY (color reconstruido); 1–7 son filtros científicos o solares
        when camera_key = 'MASTCAM' then id_filter_code = '0' and product_code = 'EBY'
        when camera_key = 'WATSON'  then product_code = 'EBY'
        -- Navcam / Hazcam: 3.ª letra F = color, G = gris
        else id_filter_code = 'F'
    end                                         as is_color,
    width_px >= 1000 and height_px >= 700       as is_large,
    sample_type = 'Full'                        as is_full_frame
from images
