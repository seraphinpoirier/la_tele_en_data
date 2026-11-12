#!/usr/bin/env python3
"""
Generate departments and regions data from Donnees_KL.db database.
Replaces process_data.py and process_regions.py which read from Excel files.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from generate_gender_stats import generate_gender_stats
from generate_candidate_stats import generate_candidate_stats

# Get the parent directory (project root)
PROJECT_DIR = Path(__file__).parent.parent
DB_PATH = PROJECT_DIR / "Donnees_KL.db"
OUTPUT_DEPT = PROJECT_DIR / "departments_data.json"
OUTPUT_REGION = PROJECT_DIR / "regions_data.json"
OUTPUT_TRIBES = PROJECT_DIR / "tribes_data.json"


def generate_departments_data():
    """Generate department statistics from database."""
    print("Generating department data from database...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get total population and candidate counts
    cursor.execute("SELECT SUM(population_2023) FROM Departements")
    total_population = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM Candidats")
    total_candidates = cursor.fetchone()[0] or 0
    
    print(f"  Total population: {total_population:,}")
    print(f"  Total candidates: {total_candidates}")
    
    # Fetch all departments with their data
    cursor.execute("""
        SELECT 
            d.id_dept,
            d.nom_dept,
            d.population_2023,
            d.candidates_count
        FROM Departements d
        ORDER BY d.nom_dept
    """)
    
    departments_data = {}
    
    for dept_id, dept_name, population, candidate_count in cursor.fetchall():
        population_pct = (population / total_population * 100) if total_population > 0 else 0
        candidate_pct = (candidate_count / total_candidates * 100) if total_candidates > 0 else 0
        gap_pct = candidate_pct - population_pct  # Note: inverted from old formula
        
        # Fetch candidates from this department
        cursor.execute("""
            SELECT nom, saison
            FROM Candidats
            WHERE id_dept = ?
            ORDER BY nom
        """, (dept_id,))
        
        candidates = [
            {"name": name, "season": season}
            for name, season in cursor.fetchall()
        ]
        
        departments_data[dept_name] = {
            "population_2023": population,
            "population_percentage": round(population_pct, 2),
            "candidate_count": candidate_count,
            "candidate_percentage": round(candidate_pct, 2),
            "gap_percentage": round(gap_pct, 2),
            "candidates": candidates
        }
    
    # Build final output
    output = {
        "metadata": {
            "total_population": total_population,
            "total_candidates": total_candidates,
            "total_departments": len(departments_data),
            "generated_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data_source": "Donnees_KL.db (replaces Excel files)",
            "note": "Generated from database queries instead of Excel files"
        },
        "departments": departments_data
    }
    
    # Save to JSON
    with open(OUTPUT_DEPT, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Generated {OUTPUT_DEPT.name}")
    print(f"     Departments: {len(departments_data)}")
    
    conn.close()
    return output


def generate_regions_data(dept_data):
    """Generate regional statistics from department data."""
    print("\nGenerating region data from database...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    total_population = dept_data['metadata']['total_population']
    total_candidates = dept_data['metadata']['total_candidates']
    
    # Fetch regions with aggregated data
    # Note: We must separate population and candidate counts to avoid Cartesian product
    # If we join with Candidats first, each candidate row duplicates the department population
    cursor.execute("""
        SELECT 
            r.id_region,
            r.nom_region,
            SUM(d.population_2023) as population,
            (SELECT COUNT(DISTINCT c.id_candidat)
             FROM Candidats c
             JOIN Departements d2 ON c.id_dept = d2.id_dept
             WHERE d2.id_region = r.id_region) as candidates
        FROM Regions r
        LEFT JOIN Departements d ON r.id_region = d.id_region
        GROUP BY r.id_region, r.nom_region
        ORDER BY r.nom_region
    """)
    
    regions_data = {}
    
    for region_id, region_name, population, candidate_count in cursor.fetchall():
        if population is None:
            population = 0
        if candidate_count is None:
            candidate_count = 0
        
        population_pct = (population / total_population * 100) if total_population > 0 else 0
        candidate_pct = (candidate_count / total_candidates * 100) if total_candidates > 0 else 0
        gap_pct = candidate_pct - population_pct
        
        # Fetch candidates from this region
        cursor.execute("""
            SELECT DISTINCT c.nom, c.saison
            FROM Candidats c
            JOIN Departements d ON c.id_dept = d.id_dept
            WHERE d.id_region = ?
            ORDER BY c.nom
        """, (region_id,))
        
        candidates = [
            {"name": name, "season": season}
            for name, season in cursor.fetchall()
        ]
        
        regions_data[region_name] = {
            "population_2023": population,
            "population_percentage": round(population_pct, 2),
            "candidate_count": candidate_count,
            "candidate_percentage": round(candidate_pct, 2),
            "gap_percentage": round(gap_pct, 2),
            "candidates": candidates
        }
    
    # Build final output
    output = {
        "metadata": {
            "total_population": total_population,
            "total_candidates": total_candidates,
            "total_regions": len(regions_data),
            "generated_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data_source": "Donnees_KL.db (replaces Excel files)",
            "note": "Generated from database queries instead of Excel files"
        },
        "regions": regions_data
    }
    
    # Save to JSON
    with open(OUTPUT_REGION, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Generated {OUTPUT_REGION.name}")
    print(f"     Regions: {len(regions_data)}")
    
    conn.close()


def generate_tribe_data():
    """Generate tribe colors per department/region for the '4 Terres' seasons."""
    print("\nGenerating 4 Terres tribe data from database...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT d.nom_dept, r.nom_region, c.tribu
        FROM Candidats c
        JOIN Departements d ON c.id_dept = d.id_dept
        JOIN Regions r ON d.id_region = r.id_region
        WHERE c.saison LIKE '%4 Terres%' AND c.tribu IS NOT NULL
    """)
    dept_colors, region_colors = {}, {}
    for dept, region, tribu in cursor.fetchall():
        dept_colors.setdefault(dept, set()).add(tribu)
        region_colors.setdefault(region, set()).add(tribu)

    cursor.execute("""
        SELECT d.nom_dept, r.nom_region
        FROM Departements d JOIN Regions r ON d.id_region = r.id_region
    """)
    dept_region = dict(cursor.fetchall())
    conn.close()

    # Most used color among the departments of each region
    region_counts = {}
    for dept, colors in dept_colors.items():
        counts = region_counts.setdefault(dept_region[dept], {})
        for color in colors:
            counts[color] = counts.get(color, 0) + 1

    departments = {}
    for dept, region in dept_region.items():
        if dept in dept_colors:
            departments[dept] = {"colors": sorted(dept_colors[dept]), "fallback": None}
        else:
            counts = region_counts.get(region)
            fallback = max(sorted(counts), key=counts.get) if counts else None
            departments[dept] = {"colors": [], "fallback": fallback}

    regions = {name: sorted(colors) for name, colors in region_colors.items()}

    output = {"departments": departments, "regions": regions}
    with open(OUTPUT_TRIBES, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"[OK] Generated {OUTPUT_TRIBES.name}")
    return output


def main():
    """Generate both datasets from database."""
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found: {DB_PATH}")
        print("Please run load_data.py first to create the database.")
        return 1
    
    try:
        print("=" * 60)
        print("GENERATING DATA FROM DATABASE")
        print("=" * 60)
        
        dept_data = generate_departments_data()
        generate_regions_data(dept_data)
        generate_tribe_data()
        generate_gender_stats()
        generate_candidate_stats()
        
        print("\n" + "=" * 60)
        print("[OK] Data generation complete!")
        print("=" * 60)
        return 0
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
