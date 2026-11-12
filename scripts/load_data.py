#!/usr/bin/env python3
"""
Script to populate Donnees_KL.sql database from Excel and CSV source files.
Handles OneDrive lock issues by using temp directory.
"""

import sqlite3
import openpyxl
import csv
import os
import sys
from pathlib import Path

# Paths
TEMP_DIR = Path(r"C:\Temp\kl_data")
PROJECT_DIR = Path(r"C:\Users\caren\OneDrive\Bureau\projet_kl\la_tele_en_data")
DATA_DIR = PROJECT_DIR / "data"
DB_PATH = PROJECT_DIR / "Donnees_KL.db"
SQL_SCHEMA_PATH = PROJECT_DIR / "Donnees_KL.sql"

# Source files (in data folder)
XLSX_POPULATION = TEMP_DIR / "POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx"
XLSX_CANDIDATES = TEMP_DIR / "donnees_kohlanta.xlsx"
CSV_DEPARTMENTS = TEMP_DIR / "departements-france.csv"


def copy_source_files():
    """Copy source files from data folder to temp directory."""
    if not TEMP_DIR.exists():
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    files_to_copy = [
        (DATA_DIR / "POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx", XLSX_POPULATION),
        (DATA_DIR / "donnees_kohlanta.xlsx", XLSX_CANDIDATES),
        (DATA_DIR / "departements-france.csv", CSV_DEPARTMENTS),
    ]
    
    for src, dst in files_to_copy:
        if src.exists():
            import shutil
            shutil.copy2(src, dst)
            print(f"[OK] Copied {src.name}")
        else:
            print(f"[ERROR] Source not found: {src}")
            return False
    
    return True


def load_population_data():
    """Load population data from Excel."""
    print("\nLoading population data...")
    population_data = {}
    
    wb = openpyxl.load_workbook(XLSX_POPULATION)
    ws = wb.active
    
    headers = [cell.value for cell in ws[1]]
    dep_idx = headers.index('dep')
    nom_idx = headers.index('nom_dep')
    pop_idx = headers.index('p23_pop')
    
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[dep_idx] and row[nom_idx]:
            dept_code = str(int(row[dep_idx])).zfill(2) if isinstance(row[dep_idx], (int, float)) else str(row[dep_idx])
            dept_name = row[nom_idx]
            population = int(row[pop_idx]) if row[pop_idx] else 0
            
            population_data[dept_name] = {
                'code': dept_code,
                'population': population,
                'region_code': None  # Will be filled from CSV
            }
    
    print(f"  Loaded {len(population_data)} departments with population data")
    return population_data


def load_regions_data():
    """Load regions and department-region mapping from CSV."""
    print("\nLoading regions data from CSV...")
    regions_data = {}
    dept_region_map = {}
    
    with open(CSV_DEPARTMENTS, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code_region = row['code_region']
            nom_region = row['nom_region']
            nom_dept = row['nom_departement']
            
            # Build region dict
            if code_region not in regions_data:
                regions_data[code_region] = nom_region
            
            # Build dept->region mapping
            dept_region_map[nom_dept] = code_region
    
    print(f"  Loaded {len(regions_data)} regions")
    print(f"  Loaded department-region mapping for {len(dept_region_map)} departments")
    return regions_data, dept_region_map


def load_candidates_data():
    """Load candidates from Excel."""
    print("\nLoading candidates data...")
    candidates_data = []
    
    wb = openpyxl.load_workbook(XLSX_CANDIDATES)
    ws = wb.active
    
    headers = [cell.value for cell in ws[1]]
    comeback_index = headers.index('CB?')
    excluded = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        comeback = row[comeback_index]
        if comeback is not None and str(comeback).strip().upper() not in ('', 'O'):
            raise ValueError(f"Unexpected CB? value {comeback!r} for {row[headers.index('NOM')]}")
        if comeback is not None and str(comeback).strip().upper() == 'O':
            excluded += 1
            continue
        candidate = {
            'saison': row[headers.index('SAISON')],
            'genre': (row[headers.index('GENRE')] or '').strip().upper() or None,
            'nom': row[headers.index('NOM')],
            'age': row[headers.index('AGE')],
            'departement': row[headers.index('DEPARTEMENT')],
            'tribu': row[headers.index('TRIBU')],
            'amb': row[headers.index('AMB?')],
            'ori': row[headers.index('ORI?')],
            'aban': row[headers.index('ABAN?')],
            'pot': row[headers.index('POT?')],
            'place': row[headers.index('PLACE')],
        }
        candidates_data.append(candidate)
    
    print(f"  Loaded {len(candidates_data)} candidates; excluded {excluded} comeback appearances")
    return candidates_data


def create_and_populate_database():
    """Create database and populate it with data."""
    print(f"\nCreating database at: {DB_PATH}")
    
    # Load all data
    population_data = load_population_data()
    regions_data, dept_region_map = load_regions_data()
    candidates_data = load_candidates_data()
    
    # Rebuild from scratch so re-runs don't duplicate rows
    if DB_PATH.exists():
        DB_PATH.unlink()

    # Create database and load schema
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Load and execute schema
    with open(SQL_SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema = f.read()
        cursor.executescript(schema)
    
    print(f"[OK] Database schema created")
    
    # Insert regions
    print("\nInserting regions...")
    for code_region, nom_region in sorted(regions_data.items()):
        try:
            cursor.execute(
                "INSERT INTO Regions (code_region, nom_region) VALUES (?, ?)",
                (code_region, nom_region)
            )
        except sqlite3.IntegrityError:
            pass  # Region already exists
    
    print(f"  Inserted/updated {len(regions_data)} regions")
    
    # Insert departments
    print("\nInserting departments...")
    
    # First, get region ID mapping
    cursor.execute("SELECT code_region, id_region FROM Regions")
    region_map = {code: id_reg for code, id_reg in cursor.fetchall()}
    
    dept_count = 0
    for dept_name, dept_info in population_data.items():
        # Get region code from CSV mapping
        region_code = dept_region_map.get(dept_name)
        id_region = region_map.get(region_code, 1)  # Default to 1 if not found
        
        try:
            cursor.execute(
                """INSERT INTO Departements 
                   (code_dept, nom_dept, id_region, population_2023)
                   VALUES (?, ?, ?, ?)""",
                (dept_info['code'], dept_name, id_region, dept_info['population'])
            )
            dept_count += 1
        except sqlite3.IntegrityError:
            pass  # Department already exists
    
    print(f"  Inserted/updated {dept_count} departments")
    
    # Build department name to ID map
    cursor.execute("SELECT id_dept, nom_dept FROM Departements")
    dept_map = {name: id_dept for id_dept, name in cursor.fetchall()}
    
    # Insert candidates
    print("\nInserting candidates...")
    cand_count = 0
    for candidate in candidates_data:
        dept_name = candidate['departement']
        id_dept = dept_map.get(dept_name)
        
        # Convert boolean-like values
        amb = 1 if candidate['amb'] else 0
        ori = 1 if candidate['ori'] else 0
        aban = 1 if candidate['aban'] else 0
        pot = 1 if candidate['pot'] else 0
        
        try:
            cursor.execute(
                """INSERT INTO Candidats 
                   (saison, genre, nom, age, id_dept, tribu, amb, ori, aban, pot, place)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (candidate['saison'], candidate['genre'], candidate['nom'],
                 candidate['age'], id_dept, candidate['tribu'],
                 amb, ori, aban, pot, candidate['place'])
            )
            cand_count += 1
        except Exception as e:
            print(f"  Warning: Could not insert candidate {candidate['nom']}: {e}")
    
    print(f"  Inserted {cand_count} candidates")
    
    # Update candidate counts in departments
    print("\nUpdating department candidate counts...")
    cursor.execute("""
        UPDATE Departements
        SET candidates_count = (
            SELECT COUNT(*) FROM Candidats WHERE id_dept = Departements.id_dept
        )
    """)
    
    # Commit and close
    conn.commit()
    
    # Print summary statistics
    print("\n" + "="*60)
    print("DATABASE SUMMARY")
    print("="*60)
    
    cursor.execute("SELECT COUNT(*) FROM Regions")
    print(f"Regions: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM Departements")
    print(f"Departments: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM Candidats")
    print(f"Candidates: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM Departements WHERE candidates_count > 0")
    depts_with_candidates = cursor.fetchone()[0]
    print(f"Departments with candidates: {depts_with_candidates}")
    
    cursor.execute("""
        SELECT saison, COUNT(*) as count 
        FROM Candidats 
        GROUP BY saison 
        ORDER BY saison
    """)
    print("\nCandidates by season:")
    for saison, count in cursor.fetchall():
        print(f"  {saison}: {count}")
    
    conn.close()
    
    print(f"\n[OK] Database created successfully at: {DB_PATH}")
    print(f"[OK] Database size: {DB_PATH.stat().st_size / 1024:.1f} KB")


def main():
    """Main entry point."""
    try:
        print("Donnees_KL Database Initialization")
        print("=" * 60)
        
        # Copy files from OneDrive to temp
        if not copy_source_files():
            print("[ERROR] Failed to copy source files")
            return 1
        
        # Verify source files exist
        for file_path in [XLSX_POPULATION, XLSX_CANDIDATES, CSV_DEPARTMENTS]:
            if not file_path.exists():
                print(f"[ERROR] Source file not found: {file_path}")
                return 1
        
        # Create and populate database
        create_and_populate_database()
        
        print("\n" + "=" * 60)
        print("[OK] Process completed successfully!")
        return 0
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
