from _warehouse import to_csv

to_csv("""
    select sol, camera_key, count(*) as images, count(*) filter (where is_color) as color_images
    from marts.fct_images group by all order by sol, camera_key
""")
