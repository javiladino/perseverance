import json

from _warehouse import connect

with connect() as con:
    rel = con.sql("select * from marts.mart_mission_kpis")
    row = dict(zip(rel.columns, rel.fetchall()[0], strict=True))
print(json.dumps(row, default=str))
