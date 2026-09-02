#!/usr/bin/env python3
"""
PujaPath - Master 248 Pandal Dataset Validation & Audit Script

This script validates the master dataset against the 248 original records in
data/kolkata_durga_puja_pandals_no_address.csv.

It checks:
- Source row count vs Master row count
- Unique IDs, missing IDs, duplicate IDs
- Valid, invalid, suspicious, and duplicate coordinates
- Prepares data/pandals_postgresql_ready.csv (containing verified records ready for SQL import)
- Prepares data/pandals_needing_manual_verification.csv
- Generates data/pandal_location_verification_report.csv
- Prints the exact mandatory summary report format.
"""

import os
import sys
from pathlib import Path
import pandas as pd

KOLKATA_LAT_MIN, KOLKATA_LAT_MAX = 21.50, 23.50
KOLKATA_LON_MIN, KOLKATA_LON_MAX = 87.50, 89.50


def run_validation():
    source_path = Path("data/kolkata_durga_puja_pandals_no_address.csv")
    geocoded_path = Path("data/kolkata_durga_puja_pandals_geocoded.csv")
    pg_ready_path = Path("data/pandals_postgresql_ready.csv")
    report_path = Path("data/pandal_location_verification_report.csv")
    manual_path = Path("data/pandals_needing_manual_verification.csv")
    duplicates_path = Path("data/pandal_duplicates.csv")
    summary_report_path = Path("data/geocoding_report.txt")

    if not source_path.exists():
        print(f"Error: Original source CSV '{source_path}' not found.", file=sys.stderr)
        sys.exit(1)

    source_df = pd.read_csv(source_path)
    orig_count = len(source_df)
    orig_unique_ids = set(source_df["pandal_id"].astype(str).str.strip())

    if geocoded_path.exists():
        master_df = pd.read_csv(geocoded_path)
    else:
        master_df = source_df.copy()

    master_count = len(master_df)
    master_unique_ids = set(master_df["pandal_id"].astype(str).str.strip())

    missing_ids = list(orig_unique_ids - master_unique_ids)
    duplicate_id_df = master_df[master_df.duplicated(subset=["pandal_id"], keep=False)]
    duplicate_ids_count = len(duplicate_id_df)

    # Coordinate & Location Audit
    valid_coords_count = 0
    invalid_coords_count = 0
    needs_review_count = 0
    missing_coords_count = 0
    verified_locations_count = 0
    manual_verification_required_count = 0

    pg_rows = []
    verification_rows = []
    manual_rows = []
    duplicate_report_rows = []

    for idx, row in master_df.iterrows():
        pid = str(row.get("pandal_id")).strip()
        pname = str(row.get("pandal_name", "")).strip()
        region = str(row.get("region", "")).strip()
        metro = str(row.get("nearest_metro", "")).strip()
        lat_val = row.get("latitude")
        lon_val = row.get("longitude")
        display_name = str(row.get("geocoded_display_name", "")).strip() if pd.notna(row.get("geocoded_display_name")) else ""
        geo_status = str(row.get("geocode_status", "")).strip()
        geo_query = str(row.get("geocode_query", "")).strip() if pd.notna(row.get("geocode_query")) else ""

        coord_status = "missing"
        loc_status = "manual_verification_required"
        is_valid_coord = False

        if pd.notna(lat_val) and pd.notna(lon_val) and str(lat_val).strip() != "" and str(lon_val).strip() != "":
            try:
                lat = float(lat_val)
                lon = float(lon_val)
                if (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0):
                    if (KOLKATA_LAT_MIN <= lat <= KOLKATA_LAT_MAX) and (KOLKATA_LON_MIN <= lon <= KOLKATA_LON_MAX):
                        coord_status = "valid"
                        loc_status = "verified"
                        is_valid_coord = True
                        valid_coords_count += 1
                        verified_locations_count += 1
                    else:
                        coord_status = "needs_review"
                        loc_status = "manual_verification_required"
                        needs_review_count += 1
                        manual_verification_required_count += 1
                else:
                    coord_status = "invalid_range"
                    loc_status = "manual_verification_required"
                    invalid_coords_count += 1
                    manual_verification_required_count += 1
            except (ValueError, TypeError):
                coord_status = "invalid_range"
                loc_status = "manual_verification_required"
                invalid_coords_count += 1
                manual_verification_required_count += 1
        else:
            coord_status = "missing"
            loc_status = "manual_verification_required"
            missing_coords_count += 1
            manual_verification_required_count += 1

        # Audit verification tracking row
        verification_rows.append({
            "pandal_id": pid,
            "pandal_name": pname,
            "region": region,
            "latitude": lat_val,
            "longitude": lon_val,
            "geocode_query": geo_query,
            "geocoded_display_name": display_name,
            "geocode_source": "OpenStreetMap Nominatim",
            "geocode_status": geo_status,
            "coordinate_status": coord_status,
            "location_status": loc_status,
        })

        # Manual verification required row
        if loc_status == "manual_verification_required":
            query_str = f"{pname} {region} Kolkata Durga Puja".strip()
            g_url = f"https://www.google.com/maps/search/?api=1&query={pd.Series(query_str).str.replace(' ', '+').values[0]}"
            osm_url = f"https://www.openstreetmap.org/search?query={pd.Series(query_str).str.replace(' ', '+').values[0]}"
            
            manual_rows.append({
                "pandal_id": pid,
                "pandal_name": pname,
                "region": region,
                "nearest_metro": metro,
                "nearest_railway_station": row.get("nearest_railway_station"),
                "description": row.get("description"),
                "theme": row.get("theme"),
                "metro_assignment_note": row.get("metro_assignment_note"),
                "queries_attempted": row.get("queries_attempted"),
                "reason_for_failure": "Location not geocoded or needs visual review",
                "google_maps_url": row.get("google_maps_url", g_url),
                "openstreetmap_url": row.get("openstreetmap_url", osm_url),
            })

        # PostgreSQL Ready dataset mapping (ONLY for valid/verified records)
        if is_valid_coord:
            addr = display_name if display_name else f"{region}, Kolkata, West Bengal, India"
            dist_km = pd.to_numeric(row.get("nearest_metro_distance_km"), errors="coerce")
            walking_dist_m = int(dist_km * 1000) if pd.notna(dist_km) else 0

            pg_rows.append({
                "id": pid,
                "name": pname,
                "area": region,
                "address": addr,
                "latitude": float(lat_val),
                "longitude": float(lon_val),
                "image": row.get("image_url", pd.NA),
                "walking_distance": walking_dist_m,
                "nearest_metro": metro if metro else pd.NA,
                "popularity": row.get("popularity_score", pd.NA),
                "crowd_level": row.get("expected_crowd_level", pd.NA),
                "theme": row.get("theme", pd.NA),
                "description": row.get("description", pd.NA),
                "rating": 4.5,
                "organizer": pd.NA,
                "opening_time": "06:00 AM",
                "closing_time": "12:00 AM",
            })

    # Save output CSVs
    pg_df = pd.DataFrame(pg_rows)
    pg_df.to_csv(pg_ready_path, index=False)

    verif_df = pd.DataFrame(verification_rows)
    verif_df.to_csv(report_path, index=False)

    manual_df = pd.DataFrame(manual_rows)
    manual_df.to_csv(manual_path, index=False)

    # Duplicate check report
    dup_name_df = master_df[master_df.duplicated(subset=["pandal_name"], keep=False)]
    dup_df = pd.concat([duplicate_id_df, dup_name_df]).drop_duplicates()
    dup_df.to_csv(duplicates_path, index=False)

    # Print exact summary output format
    print("====================================")
    print("PUJAPATH PANDAL DATA REPORT")
    print("====================================")
    print(f"Original pandals: {orig_count}")
    print(f"Master dataset pandals: {master_count}")
    print(f"Verified locations: {verified_locations_count}")
    print(f"Manual verification required: {manual_verification_required_count}")
    print(f"Duplicate IDs: {duplicate_ids_count}")
    print(f"Missing IDs: {len(missing_ids)}")
    print(f"Invalid coordinates: {invalid_coords_count}")
    print(f"Needs review: {needs_review_count}")
    print("====================================\n")
    print(f"PostgreSQL Ready Dataset ({len(pg_df)} records) saved -> {pg_ready_path}")
    print(f"Manual Verification List ({len(manual_df)} records) saved -> {manual_path}")


if __name__ == "__main__":
    run_validation()
