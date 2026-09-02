#!/usr/bin/env python3
"""
PujaPath - Location Verification, Duplicate Detection, and PostgreSQL Preparation Pipeline

This script:
1. Validates coordinate ranges (Lat -90..90, Lon -180..180, Kolkata region bounding box).
2. Performs display name relevance review flagging suspicious results as 'needs_review'.
3. Generates data/kolkata_pandals_needs_review.csv for human audit.
4. Detects duplicate pandal_ids and duplicate/suspicious pandal names -> data/pandal_duplicates.csv.
5. Prepares PostgreSQL-ready dataset data/pandals_postgresql_ready.csv (mapping distance to meters).
6. Generates full pipeline summary report -> data/geocoding_report.txt.
"""

import os
import sys
from pathlib import Path
import pandas as pd

# Bounding box for Kolkata & Greater Kolkata Metropolitan Area
KOLKATA_LAT_MIN, KOLKATA_LAT_MAX = 21.50, 23.50
KOLKATA_LON_MIN, KOLKATA_LON_MAX = 87.50, 89.50


def verify_row_coordinates(row):
    """
    Validate latitude and longitude values for a single record.
    Returns: (coordinate_status, verified_address, address_status)
    """
    lat_val = row.get("latitude")
    lon_val = row.get("longitude")
    geocode_status = str(row.get("geocode_status", "")).strip()
    display_name = str(row.get("geocoded_display_name", "")).strip() if pd.notna(row.get("geocoded_display_name")) else ""

    # Check for missing coordinates
    if pd.isna(lat_val) or pd.isna(lon_val) or str(lat_val).strip() == "" or str(lon_val).strip() == "":
        return "missing", "", "missing"

    try:
        lat = float(lat_val)
        lon = float(lon_val)
    except (ValueError, TypeError):
        return "invalid_range", "", "missing"

    # Global latitude/longitude bounds check
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return "invalid_range", "", "missing"

    # Regional bounding box check (Kolkata / West Bengal area)
    if not (KOLKATA_LAT_MIN <= lat <= KOLKATA_LAT_MAX) or not (KOLKATA_LON_MIN <= lon <= KOLKATA_LON_MAX):
        return "needs_review", display_name, "needs_review" if display_name else "missing"

    # Display name audit: check if returned display name contains Kolkata / West Bengal relevance
    if display_name:
        disp_lower = display_name.lower()
        has_location_keyword = any(kw in disp_lower for kw in ["kolkata", "bengal", "howrah", "24 parganas", "hooghly", "india"])
        if not has_location_keyword:
            return "needs_review", display_name, "needs_review"
        return "valid", display_name, "verified"
    else:
        # If coordinates came from original file without display_name
        if geocode_status == "existing_coordinate":
            return "valid", "", "missing"
        return "needs_review", "", "missing"


def run_verification(geocoded_csv_path, needs_review_path, postgres_csv_path, duplicates_csv_path, report_path):
    print("=" * 60)
    print("PujaPath Coordinate Verification & PostgreSQL Preparation")
    print("=" * 60)

    if not Path(geocoded_csv_path).exists():
        print(f"Error: Geocoded file '{geocoded_csv_path}' not found.", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(geocoded_csv_path)
    total_records = len(df)

    coord_statuses = []
    verified_addresses = []
    address_statuses = []

    for idx, row in df.iterrows():
        c_status, v_addr, a_status = verify_row_coordinates(row)
        coord_statuses.append(c_status)
        verified_addresses.append(v_addr)
        address_statuses.append(a_status)

    df["coordinate_status"] = coord_statuses
    df["verified_address"] = verified_addresses
    df["address_status"] = address_statuses

    # 1. Generate Needs Review CSV
    needs_review_mask = (
        (df["coordinate_status"] == "needs_review")
        | (df["geocode_status"].isin(["not_found", "error"]))
        | (df["coordinate_status"] == "invalid_range")
    )
    
    review_columns = [
        "pandal_id",
        "pandal_name",
        "region",
        "nearest_metro",
        "geocode_query",
        "geocoded_display_name",
        "latitude",
        "longitude",
        "coordinate_status",
        "geocode_status",
    ]
    # Ensure review columns exist in df
    available_review_cols = [c for c in review_columns if c in df.columns]
    needs_review_df = df[needs_review_mask][available_review_cols].copy()
    
    os.makedirs(os.path.dirname(needs_review_path), exist_ok=True)
    needs_review_df.to_csv(needs_review_path, index=False)
    print(f"Saved records needing review ({len(needs_review_df)} rows) -> {needs_review_path}")

    # 2. Duplicate Detection
    duplicate_rows = []
    # Check duplicate IDs
    dup_ids = df[df.duplicated(subset=["pandal_id"], keep=False)]
    for idx, row in dup_ids.iterrows():
        duplicate_rows.append({
            "duplicate_type": "duplicate_id",
            "pandal_id": row.get("pandal_id"),
            "pandal_name": row.get("pandal_name"),
            "region": row.get("region"),
            "notes": "Duplicate pandal_id detected"
        })

    # Check duplicate or suspicious pandal names (normalized exact match)
    df["_name_clean"] = df["pandal_name"].astype(str).str.strip().str.lower()
    dup_names = df[df.duplicated(subset=["_name_clean"], keep=False)]
    for idx, row in dup_names.iterrows():
        duplicate_rows.append({
            "duplicate_type": "duplicate_name",
            "pandal_id": row.get("pandal_id"),
            "pandal_name": row.get("pandal_name"),
            "region": row.get("region"),
            "notes": "Duplicate/suspicious pandal name detected"
        })
    df.drop(columns=["_name_clean"], inplace=True, errors="ignore")

    dup_df = pd.DataFrame(duplicate_rows)
    os.makedirs(os.path.dirname(duplicates_csv_path), exist_ok=True)
    dup_df.to_csv(duplicates_csv_path, index=False)
    print(f"Saved duplicate audit report ({len(dup_df)} entries) -> {duplicates_csv_path}")

    # 3. Data Cleaning & Mapping for PostgreSQL
    # Column Mappings:
    # pandal_id -> id
    # pandal_name -> name
    # region -> area
    # verified_address -> address (fall back to area if empty, address must be NOT NULL)
    # latitude -> latitude
    # longitude -> longitude
    # image_url -> image
    # nearest_metro -> nearest_metro
    # nearest_metro_distance_km * 1000 -> walking_distance
    # theme -> theme
    # description -> description

    pg_df = pd.DataFrame()
    pg_df["id"] = df["pandal_id"].astype(str)
    pg_df["name"] = df["pandal_name"].astype(str)
    pg_df["area"] = df["region"].astype(str)
    
    # Address: address field is TEXT NOT NULL in SQL.
    # Use verified_address if available, otherwise fall back to area description without inventing street addresses
    pg_df["address"] = df["verified_address"].fillna("").astype(str)
    pg_df["address"] = pg_df.apply(
        lambda r: r["address"] if r["address"].strip() else f"{r['area']}, Kolkata, West Bengal, India", axis=1
    )

    pg_df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    pg_df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    pg_df["image"] = df.get("image_url", pd.NA)
    
    # Convert walking distance from km to meters (integer)
    dist_km = pd.to_numeric(df.get("nearest_metro_distance_km"), errors="coerce")
    pg_df["walking_distance"] = (dist_km * 1000).fillna(0).round().astype(int)
    
    pg_df["nearest_metro"] = df.get("nearest_metro", pd.NA)
    pg_df["popularity"] = df.get("popularity_score", pd.NA)
    pg_df["crowd_level"] = df.get("expected_crowd_level", pd.NA)
    pg_df["theme"] = df.get("theme", pd.NA)
    pg_df["description"] = df.get("description", pd.NA)
    
    # Optional fields defaults
    pg_df["rating"] = 4.5
    pg_df["organizer"] = pd.NA
    pg_df["opening_time"] = "06:00 AM"
    pg_df["closing_time"] = "12:00 AM"

    os.makedirs(os.path.dirname(postgres_csv_path), exist_ok=True)
    pg_df.to_csv(postgres_csv_path, index=False)
    print(f"Saved PostgreSQL ready CSV ({len(pg_df)} rows) -> {postgres_csv_path}")

    # 4. Generate Comprehensive Final Report
    status_counts = df["geocode_status"].value_counts()
    coord_counts = df["coordinate_status"].value_counts()
    addr_counts = df["address_status"].value_counts()

    total_pandals = total_records
    successful_geocoding = int(status_counts.get("success", 0))
    existing_coords = int(status_counts.get("existing_coordinate", 0))
    not_found = int(status_counts.get("not_found", 0))
    errors = int(status_counts.get("error", 0))
    needs_review = len(needs_review_df)
    valid_coords = int(coord_counts.get("valid", 0))
    invalid_coords = int(coord_counts.get("invalid_range", 0))
    missing_addresses = int((df["verified_address"] == "").sum())
    duplicate_ids_cnt = len(dup_ids)
    duplicate_names_cnt = len(dup_names)

    report_content = f"""==================================================
PUJAPATH PANDAL LOCATION PIPELINE DATA REPORT
==================================================

Total pandals: {total_pandals}
Successful geocoding: {successful_geocoding}
Existing coordinates: {existing_coords}
Not found: {not_found}
Errors: {errors}
Needs review: {needs_review}
Valid coordinates: {valid_coords}
Invalid coordinates: {invalid_coords}
Missing addresses: {missing_addresses}
Duplicate IDs: {duplicate_ids_cnt}
Duplicate/suspicious names: {duplicate_names_cnt}

==================================================
FILE ARTIFACTS GENERATED:
- Geocoded CSV: {geocoded_csv_path}
- Needs Review CSV: {needs_review_path}
- Duplicates Audit: {duplicates_csv_path}
- PostgreSQL Ready CSV: {postgres_csv_path}
==================================================
"""
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"Saved final pipeline report -> {report_path}")
    print("\n" + report_content)


if __name__ == "__main__":
    geocoded_csv = "data/kolkata_durga_puja_pandals_geocoded.csv"
    needs_review = "data/kolkata_pandals_needs_review.csv"
    postgres_csv = "data/pandals_postgresql_ready.csv"
    duplicates_csv = "data/pandal_duplicates.csv"
    report_file = "data/geocoding_report.txt"
    
    run_verification(geocoded_csv, needs_review, postgres_csv, duplicates_csv, report_file)
