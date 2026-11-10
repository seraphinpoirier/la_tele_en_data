# Data Pipeline Restructuring

## Overview

The project has been restructured to use **Donnees_KL.db** as the source of truth, instead of directly reading from Excel files.

### Data Flow

```
┌─────────────────┐
│  Excel & CSV    │  (Source files - NOT used directly anymore)
│  - donnees_kohlanta.xlsx
│  - POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx
│  - departements-france.csv
└────────┬────────┘
         │
         │ (one-time import)
         │
         ▼
┌─────────────────┐
│  Donnees_KL.db  │  (Database - NEW source of truth)
└────────┬────────┘
         │
         │ (regenerated via generate_data_from_db.py)
         │
         ▼
┌──────────────────────┐
│   JSON Data Files    │  (Used by index.html)
│ - departments_data.json
│ - regions_data.json
└──────────────────────┘
         │
         │
         ▼
┌──────────────────────┐
│   index.html         │  (Web visualization)
└──────────────────────┘
```

## Key Changes

### Deleted Files (Old Excel-based approach)

- ✗ `process_data.py` - **DELETED** (read directly from Excel)
- ✗ `process_regions.py` - **DELETED** (aggregated JSON data)

These scripts directly read Excel files and generated JSON. Now we use the database as intermediary.

### New Files

- ✅ `generate_data_from_db.py` - Generates JSON from database queries (replaces process_data.py + process_regions.py)
- ✅ `update_data.py` - Simple wrapper to regenerate data (run this when database changes)
- ✅ `Donnees_KL.db` - SQLite database with all source data
- ✅ `Donnees_KL.sql` - Database schema definition
- ✅ `load_data.py` - Script to populate database from Excel/CSV

### Unchanged Files

- ✓ `index.html` - Still uses JSON files (no changes needed)
- ✓ `departments_data.json` - Still auto-generated, now from database
- ✓ `regions_data.json` - Still auto-generated, now from database
- ✓ Excel & CSV files - Kept as source material (not actively used)

## Workflow

### 1. First-time Setup

```bash
# Create database from Excel/CSV files
python load_data.py

# Generate JSON files from database
python generate_data_from_db.py

# Run web server
python -m http.server 8000
```

### 2. Updating Data

If you modify the Excel files:

```bash
# Regenerate database from new Excel files
python load_data.py

# Regenerate JSON files
python update_data.py

# Web browser will auto-refresh (JSON files changed)
```

### 3. Checking Data

View database contents:
```bash
python verify_database.py
```

View generated JSON files:
```bash
python verify_generated_data.py
```

## Database Structure

See [README_DATABASE.md](./README_DATABASE.md) for complete schema documentation.

### Tables
- **Regions** - 18 French administrative regions
- **Departements** - 100 departments with population (2023)
- **Candidats** - 221 candidates with seasons, ages, genres

### Views
- **DeptRepresentation** - Department statistics with gap calculations
- **RegionRepresentation** - Regional statistics with gap calculations
- **CandidatsBySeason** - Candidates grouped by season

## Advantages of Database-Driven Approach

1. **Single Source of Truth** - Database is authoritative
2. **Easier Queries** - Complex filtering/aggregation in SQL
3. **Better Data Integrity** - Foreign keys and constraints
4. **Scalability** - Easy to add more data/features
5. **Auditability** - Track changes, add timestamps
6. **Performance** - Faster to query than Excel files

## Excel Files (Kept for Reference)

- **donnees_kohlanta.xlsx** - Raw candidate data (221 rows)
- **POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx** - Population data (100 rows)
- **departements-france.csv** - Department-region mapping (100 rows + 1 header)

These are the "source files" but are no longer directly read by scripts. They're backed up in the database.

## Troubleshooting

### "Database not found" error
Run `python load_data.py` to recreate from Excel files.

### JSON files not updating
Run `python update_data.py` to regenerate from database.

### Data looks wrong in web interface
1. Check database: `python verify_database.py`
2. Check JSON: `python verify_generated_data.py`
3. Refresh browser cache
