# PujaPath - Kolkata Durga Puja Pandal Geocoding & Data Pipeline

This folder contains the complete, production-grade location data pipeline for **PujaPath**. It geocodes pandal locations using OpenStreetMap Nominatim, validates spatial boundaries, audits display names, flags questionable records for review, and prepares clean data for PostgreSQL import.

---

## 🛡️ Key Principles & Safety Rules

- **No Artificial Coordinates**: Missing coordinates are left empty and marked `not_found`.
- **No Inferred Addresses**: Addresses are derived strictly from geocoded display names or flagged as `missing`.
- **Original Source Integrity**: `data/kolkata_durga_puja_pandals_no_address.csv` is never overwritten or mutated.
- **Nominatim Policy Compliance**: Enforces a 1.0-second delay between API requests, single-threaded execution, and custom `User-Agent`.
- **Checkpoint Resilience**: Progress is automatically saved after every single record; interrupted runs resume seamlessly with `--resume`.
- **Staged Database Import**: Data is imported into PostgreSQL **only** after geocoding, verification, and human audit.

---

## 🛠️ Step-by-Step Setup & Operational Instructions (Windows PowerShell)

### Step 1: Open PowerShell and Navigate to Workspace
```powershell
cd "c:\Users\sinha\Desktop\durga pooja"
```

### Step 2: Create Python Virtual Environment
```powershell
python -m venv venv
```

### Step 3: Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

### Step 4: Install Dependencies
```powershell
python -m pip install -r geocoding\requirements.txt
```

---

## 🗺️ Execution Workflow

### Step 5: Run First-Pass Geocoding
To start processing all 248 Kolkata Durga Puja pandal records:
```powershell
python geocoding\geocode_pandals.py
```

### Step 6: Resume Interrupted Geocoding
If the script stops or is interrupted (e.g. at record 120/248), resume without losing progress:
```powershell
python geocoding\geocode_pandals.py --resume
```

### Step 7: Run Second-Pass Retry for Failed Records
For records marked `not_found` or `error` in pass 1, attempt a second-pass query incorporating nearest metro station information:
```powershell
python geocoding\geocode_pandals.py --retry-failed
```

### Step 8: Validate Coordinates & Generate Audit Reports
Run the coordinate validation, display name audit, duplicate check, and PostgreSQL dataset preparation script:
```powershell
python geocoding\verify_coordinates.py
```

### Step 9: Review Generated Audit CSVs
Inspect the generated files in the `data/` directory:
- `data/kolkata_pandals_needs_review.csv`: Inspect records requiring human verification.
- `data/pandal_duplicates.csv`: Audit duplicate IDs and suspicious duplicate pandal names.
- `data/geocoding_report.txt`: View comprehensive pipeline statistics summary.

### Step 10: PostgreSQL Database Import
Once location data is reviewed and approved, import `data/pandals_postgresql_ready.csv` into PostgreSQL using the database SQL scripts:
```powershell
psql -U postgres -d pujapath -f database\05_seed_data.sql
```

---

## 📁 Artifact Summary

| File Path | Description |
|---|---|
| `data/kolkata_durga_puja_pandals_no_address.csv` | Original raw dataset (248 records, untouched) |
| `data/kolkata_durga_puja_pandals_geocoded.csv` | Primary output containing geocoding fields & coords |
| `data/kolkata_pandals_geocoding_failed.csv` | Records with `not_found` or `error` status |
| `data/kolkata_pandals_needs_review.csv` | Audit CSV for questionable display names or bounds |
| `data/pandals_postgresql_ready.csv` | Clean dataset formatted & mapped for PostgreSQL |
| `data/pandal_duplicates.csv` | Duplicate ID and name check audit report |
| `data/geocoding_report.txt` | Full statistical summary report |
