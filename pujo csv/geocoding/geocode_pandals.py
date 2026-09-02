#!/usr/bin/env python3
"""
PujaPath - Kolkata Durga Puja Pandal Multi-Stage Geocoding Pipeline

This script geocodes all 248 Kolkata Durga Puja pandals using OpenStreetMap Nominatim.
It applies a multi-stage search strategy per pandal, respects Nominatim's usage policy (1s delay, User-Agent),
saves progress after every single record, supports resume (--resume) and retry (--retry-failed),
and generates audit tracking files without modifying the original raw CSV dataset.
"""

import os
import sys
import time
import urllib.parse
import argparse
from pathlib import Path
import pandas as pd
import requests

# Unbuffered print for PowerShell
_print = print
def print(*args, **kwargs):
    kwargs.setdefault("flush", True)
    _print(*args, **kwargs)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
DEFAULT_CONTACT_EMAIL = "student@example.com"
DEFAULT_USER_AGENT = f"PujaPath/1.0 (student project; contact: {DEFAULT_CONTACT_EMAIL})"


def setup_args():
    parser = argparse.ArgumentParser(
        description="Multi-stage geocoding for Kolkata Durga Puja pandals via OpenStreetMap Nominatim."
    )
    parser.add_argument(
        "--input",
        type=str,
        default="data/kolkata_durga_puja_pandals_no_address.csv",
        help="Path to original input CSV file",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/kolkata_durga_puja_pandals_geocoded.csv",
        help="Path to geocoded output CSV file",
    )
    parser.add_argument(
        "--verification-report",
        type=str,
        default="data/pandal_location_verification_report.csv",
        help="Path to pandal location verification tracking report CSV",
    )
    parser.add_argument(
        "--manual-verification",
        type=str,
        default="data/pandals_needing_manual_verification.csv",
        help="Path to pandals needing manual verification CSV",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume processing using existing output file if present",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Perform retry geocoding for failed/unverified records",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay between API requests in seconds (default: 1.0)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=15,
        help="API request timeout in seconds (default: 15)",
    )
    parser.add_argument(
        "--email",
        type=str,
        default=DEFAULT_CONTACT_EMAIL,
        help="Contact email address for Nominatim User-Agent",
    )
    return parser.parse_args()


def generate_search_strategies(pandal_name, region, nearest_metro):
    """
    Generate ordered multi-stage search queries for a given pandal.
    """
    clean_name = str(pandal_name).strip() if pd.notna(pandal_name) else ""
    clean_region = str(region).strip() if pd.notna(region) else ""
    clean_metro = str(nearest_metro).strip() if pd.notna(nearest_metro) else ""

    if not clean_name:
        return []

    strategies = []
    
    # Strategy 1: "{pandal_name}, {region}, Kolkata, West Bengal, India"
    if clean_region:
        strategies.append(f"{clean_name}, {clean_region}, Kolkata, West Bengal, India")
    else:
        strategies.append(f"{clean_name}, Kolkata, West Bengal, India")

    # Strategy 2: "{pandal_name}, Kolkata, West Bengal, India"
    s2 = f"{clean_name}, Kolkata, West Bengal, India"
    if s2 not in strategies:
        strategies.append(s2)

    # Strategy 3: "{pandal_name}, {nearest_metro}, Kolkata, India"
    if clean_metro:
        metro_str = clean_metro if "metro" in clean_metro.lower() else f"{clean_metro} Metro"
        s3 = f"{clean_name}, {metro_str}, Kolkata, India"
        if s3 not in strategies:
            strategies.append(s3)

    # Strategy 4: "{pandal_name}, Kolkata"
    s4 = f"{clean_name}, Kolkata"
    if s4 not in strategies:
        strategies.append(s4)

    # Strategy 5: "{pandal_name}, {nearest_metro}, {region}, Kolkata, West Bengal"
    if clean_metro and clean_region:
        metro_str = clean_metro if "metro" in clean_metro.lower() else f"{clean_metro} Metro"
        s5 = f"{clean_name}, {metro_str}, {clean_region}, Kolkata, West Bengal"
        if s5 not in strategies:
            strategies.append(s5)

    return strategies


def generate_manual_verification_urls(pandal_name, region):
    """Generate Google Maps & OpenStreetMap search URLs for manual location review."""
    clean_name = str(pandal_name).strip() if pd.notna(pandal_name) else "Durga Puja Pandal"
    clean_region = str(region).strip() if pd.notna(region) else ""

    query_str = f"{clean_name} {clean_region} Kolkata Durga Puja".strip()
    encoded_query = urllib.parse.quote(query_str)

    google_maps_url = f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
    openstreetmap_url = f"https://www.openstreetmap.org/search?query={encoded_query}"

    return google_maps_url, openstreetmap_url


def query_nominatim_single(query, user_agent, delay=1.0, timeout=15, retries=2):
    """Query single Nominatim search string."""
    headers = {"User-Agent": user_agent}
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }

    for attempt in range(retries):
        try:
            response = requests.get(NOMINATIM_URL, headers=headers, params=params, timeout=timeout)
            
            if response.status_code in (429, 503):
                wait_time = delay * (2 ** (attempt + 1))
                print(f"    [Rate Limit HTTP {response.status_code}] Pausing {wait_time:.1f}s...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            data = response.json()

            if isinstance(data, list) and len(data) > 0:
                result = data[0]
                lat = float(result.get("lat"))
                lon = float(result.get("lon"))
                display_name = str(result.get("display_name", "")).strip()
                return lat, lon, display_name, "success", None
            else:
                return None, None, "", "not_found", "No result returned"
        except requests.exceptions.Timeout:
            time.sleep(delay)
            continue
        except Exception as err:
            time.sleep(delay)
            return None, None, "", "error", str(err)

    return None, None, "", "not_found", "No result returned after retries"


def run_multistage_geocode(pandal_name, region, nearest_metro, user_agent, delay=1.0, timeout=15):
    """
    Iterate through multi-stage strategies for a pandal until a result is found.
    Returns: (lat, lon, display_name, successful_query, status, list_of_queries_attempted)
    """
    strategies = generate_search_strategies(pandal_name, region, nearest_metro)
    attempted_queries = []

    for strat_idx, query in enumerate(strategies, 1):
        attempted_queries.append(query)
        print(f"  Strategy {strat_idx}/{len(strategies)}: \"{query}\"")

        lat, lon, display_name, status, err_msg = query_nominatim_single(
            query, user_agent=user_agent, delay=delay, timeout=timeout
        )

        if status == "success":
            return lat, lon, display_name, query, "success", attempted_queries

        # Respect API rate limit between strategy sub-queries
        time.sleep(delay)

    return None, None, "", attempted_queries[0] if attempted_queries else "", "not_found", attempted_queries


def save_pipeline_checkpoints(df, output_path, report_path, manual_path):
    """Save all pipeline checkpoint files safely."""
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)

        # 1. Verification Report CSV
        report_cols = [
            "pandal_id",
            "pandal_name",
            "region",
            "latitude",
            "longitude",
            "geocode_query",
            "geocoded_display_name",
            "geocode_source",
            "geocode_status",
            "coordinate_status",
            "location_status",
        ]
        avail_report_cols = [c for c in report_cols if c in df.columns]
        report_df = df[avail_report_cols].copy()
        report_df.to_csv(report_path, index=False)

        # 2. Manual Verification CSV
        unverified_mask = df["location_status"] == "manual_verification_required"
        unverified_df = df[unverified_mask].copy()
        unverified_df.to_csv(manual_path, index=False)

    except Exception as err:
        print(f"Warning: Checkpoint save failed: {err}")


def main():
    args = setup_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    report_path = Path(args.verification_report)
    manual_path = Path(args.manual_verification)
    user_agent = f"PujaPath/1.0 (student project; contact: {args.email})"

    if not input_path.exists():
        print(f"Error: Input dataset file '{input_path}' not found.", file=sys.stderr)
        sys.exit(1)

    print(f"Reading input dataset: {input_path}")
    input_df = pd.read_csv(input_path)
    total_records = len(input_df)

    if total_records != 248:
        print(f"Warning: Expected 248 records, but found {total_records} in input CSV.")

    # Initialize or load output DataFrame
    if (args.resume or args.retry_failed) and output_path.exists():
        print(f"Loading existing progress file: {output_path}")
        df = pd.read_csv(output_path)
    else:
        df = input_df.copy()

    # Ensure required tracking columns exist
    required_cols = {
        "geocode_query": pd.NA,
        "geocode_status": pd.NA,
        "geocoded_display_name": pd.NA,
        "geocode_source": "OpenStreetMap Nominatim",
        "coordinate_status": "missing",
        "location_status": "manual_verification_required",
        "queries_attempted": pd.NA,
        "google_maps_url": pd.NA,
        "openstreetmap_url": pd.NA,
    }

    for col, default_val in required_cols.items():
        if col not in df.columns:
            df[col] = default_val

    # Ensure flexible object dtypes
    for col in ["latitude", "longitude", "geocode_query", "geocode_status", "geocoded_display_name", "coordinate_status", "location_status"]:
        if col in df.columns:
            df[col] = df[col].astype(object)

    print(f"Starting Multi-Stage Geocoding Pipeline for {total_records} records...\n")

    for idx in range(total_records):
        row = df.iloc[idx]
        pandal_id = row.get("pandal_id")
        pandal_name = str(row.get("pandal_name", "")).strip() if pd.notna(row.get("pandal_name")) else ""
        region = str(row.get("region", "")).strip() if pd.notna(row.get("region")) else ""
        nearest_metro = str(row.get("nearest_metro", "")).strip() if pd.notna(row.get("nearest_metro")) else ""

        g_maps_url, osm_url = generate_manual_verification_urls(pandal_name, region)
        df.at[idx, "google_maps_url"] = g_maps_url
        df.at[idx, "openstreetmap_url"] = osm_url

        print(f"[{idx + 1}/{total_records}] Pandal ID {pandal_id}: {pandal_name} ({region})")

        # 1. Existing coordinate check
        orig_lat = row.get("latitude")
        orig_lon = row.get("longitude")
        has_existing_coords = (
            pd.notna(orig_lat)
            and pd.notna(orig_lon)
            and str(orig_lat).strip() != ""
            and str(orig_lon).strip() != ""
        )

        if has_existing_coords and df.at[idx, "geocode_status"] == "existing_coordinate":
            df.at[idx, "location_status"] = "verified"
            df.at[idx, "coordinate_status"] = "valid"
            print("  STATUS: Existing coordinates present\n")
            continue

        curr_status = str(df.at[idx, "geocode_status"]).strip() if pd.notna(df.at[idx, "geocode_status"]) else ""

        # 2. In Resume mode: skip completed success rows
        if args.resume and not args.retry_failed and curr_status == "success":
            print(f"  STATUS: SKIPPED (Already geocoded: {df.at[idx, 'latitude']}, {df.at[idx, 'longitude']})\n")
            continue

        # 3. In Retry-failed mode: skip rows that already succeeded
        if args.retry_failed and curr_status == "success":
            print(f"  STATUS: SKIPPED (Already verified)\n")
            continue

        # 4. Multi-Stage Geocoding
        lat, lon, display_name, successful_query, status, attempted_queries = run_multistage_geocode(
            pandal_name=pandal_name,
            region=region,
            nearest_metro=nearest_metro,
            user_agent=user_agent,
            delay=args.delay,
            timeout=args.timeout,
        )

        df.at[idx, "geocode_query"] = successful_query
        df.at[idx, "queries_attempted"] = " | ".join(attempted_queries)

        if status == "success":
            df.at[idx, "latitude"] = lat
            df.at[idx, "longitude"] = lon
            df.at[idx, "geocoded_display_name"] = display_name
            df.at[idx, "geocode_status"] = "success"
            df.at[idx, "geocode_source"] = "OpenStreetMap Nominatim"
            df.at[idx, "coordinate_status"] = "valid"
            df.at[idx, "location_status"] = "verified"
            print(f"  SUCCESS: ({lat:.6f}, {lon:.6f}) via query \"{successful_query}\"")
            print(f"  Display Name: {display_name}\n")
        else:
            df.at[idx, "latitude"] = pd.NA
            df.at[idx, "longitude"] = pd.NA
            df.at[idx, "geocoded_display_name"] = ""
            df.at[idx, "geocode_status"] = "not_found"
            df.at[idx, "coordinate_status"] = "missing"
            df.at[idx, "location_status"] = "manual_verification_required"
            print(f"  NOT FOUND: Tried {len(attempted_queries)} strategies\n")

        # Save checkpoint after every record
        save_pipeline_checkpoints(df, output_path, report_path, manual_path)

        # Pause to strictly obey 1.0s rate limit
        time.sleep(args.delay)

    # Final summary statistics
    status_counts = df["geocode_status"].value_counts()
    loc_counts = df["location_status"].value_counts()

    total_cnt = len(df)
    success_cnt = int(status_counts.get("success", 0))
    existing_cnt = int(status_counts.get("existing_coordinate", 0))
    not_found_cnt = int(status_counts.get("not_found", 0))
    verified_cnt = int(loc_counts.get("verified", 0))
    manual_cnt = int(loc_counts.get("manual_verification_required", 0))

    print("====================================")
    print("GEOCODING PIPELINE SUMMARY")
    print("====================================")
    print(f"Total original records: {total_cnt}")
    print(f"Successfully geocoded: {success_cnt}")
    print(f"Existing coordinates: {existing_cnt}")
    print(f"Total verified locations: {verified_cnt}")
    print(f"Requiring manual verification: {manual_cnt}")
    print("====================================\n")


if __name__ == "__main__":
    main()
