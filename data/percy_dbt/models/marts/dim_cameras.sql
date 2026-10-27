select
    camera_key,
    any_value(camera_name)          as camera_name,
    list(instrument order by instrument) as instruments
from {{ ref('cameras') }}
group by camera_key
