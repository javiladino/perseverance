from _warehouse import to_csv

to_csv("""
    select camera_key, decision, count(*) as photos
    from marts.mart_photo_candidates group by all order by camera_key, decision
""")
