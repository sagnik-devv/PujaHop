import re
import json
import csv
import os

def export_eateries_to_csv():
    ts_path = "./lib/generated-eateries.ts"
    csv_path = "./data/eateries.csv"

    if not os.path.exists(ts_path):
        print(f"Error: {ts_path} not found.")
        return

    with open(ts_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r"export const GENERATED_PANDAL_EATERIES: PandalEatery\[\] = (\[[\s\S]*?\]);", content)
    if not match:
        print("Error: Could not parse GENERATED_PANDAL_EATERIES array from TypeScript file.")
        return

    data = json.loads(match.group(1))

    headers = [
        "pandal_id",
        "pandal_name",
        "eatery_name",
        "clean_name",
        "cuisine_type",
        "distance_m",
        "distance_km",
        "budget_for_two_inr",
        "best_recommended_item",
        "eatery_latitude",
        "eatery_longitude"
    ]

    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for item in data:
            writer.writerow([
                item.get("pandalId", ""),
                item.get("pandalName", ""),
                item.get("eateryName", ""),
                item.get("cleanName", ""),
                item.get("cuisineType", ""),
                item.get("distanceM", ""),
                item.get("distanceKm", ""),
                item.get("budgetForTwo", ""),
                item.get("bestRecommendedItem", ""),
                item.get("latitude", ""),
                item.get("longitude", "")
            ])

    print(f"Successfully exported {len(data)} eateries to {csv_path}")

if __name__ == "__main__":
    export_eateries_to_csv()
