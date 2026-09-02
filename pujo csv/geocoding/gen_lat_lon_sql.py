import pandas as pd

df = pd.read_csv('data/kolkata_durga_puja_pandals_geocoded.csv')

sql_lines = []
sql_lines.append("-- PujaPath - Kolkata Durga Puja Pandals Latitude & Longitude Seed")
sql_lines.append(f"-- Total Pandals: {len(df)}")
sql_lines.append("")
sql_lines.append("CREATE TABLE IF NOT EXISTS pandal_coordinates (")
sql_lines.append("    pandal_id INTEGER PRIMARY KEY,")
sql_lines.append("    pandal_name VARCHAR(250) NOT NULL,")
sql_lines.append("    latitude DECIMAL(10,7) NOT NULL,")
sql_lines.append("    longitude DECIMAL(10,7) NOT NULL")
sql_lines.append(");")
sql_lines.append("")
sql_lines.append("INSERT INTO pandal_coordinates (pandal_id, pandal_name, latitude, longitude)")
sql_lines.append("VALUES")

val_tuples = []
for idx, r in df.iterrows():
    pid = int(r["pandal_id"])
    pname = str(r["pandal_name"]).replace("'", "''")
    lat = float(r["latitude"])
    lon = float(r["longitude"])
    val_tuples.append(f"({pid}, '{pname}', {lat:.7f}, {lon:.7f})")

sql_lines.append(",\n".join(val_tuples) + ";")
sql_lines.append("")
sql_lines.append("CREATE INDEX IF NOT EXISTS idx_pandal_coords_name ON pandal_coordinates(pandal_name);")

with open("database/pandal_lat_lon.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Created database/pandal_lat_lon.sql with {len(df)} records!")
