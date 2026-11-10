#!/usr/bin/env python3
"""Quick verification of database contents"""

import sqlite3
from pathlib import Path

db_path = Path(r"C:\Users\caren\OneDrive\Bureau\projet_kl\la_tele_en_data\Donnees_KL.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n" + "="*60)
print("SAMPLE DATA FROM DATABASE")
print("="*60)

# Show a few departments with their representation
print("\nTop 5 departments by candidate count:")
cursor.execute("""
    SELECT nom_dept, population_2023, candidates_count, 
           ROUND(population_2023 * 100.0 / (SELECT SUM(population_2023) FROM Departements), 2) as pop_pct,
           ROUND(candidates_count * 100.0 / (SELECT COUNT(*) FROM Candidats), 2) as cand_pct
    FROM Departements
    WHERE candidates_count > 0
    ORDER BY candidates_count DESC
    LIMIT 5
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[2]} candidates ({row[4]}%), pop: {row[1]:,} ({row[3]}%)")

# Show a few candidates
print("\nSample candidates:")
cursor.execute("""
    SELECT c.nom, c.saison, d.nom_dept, c.age, c.genre
    FROM Candidats c
    LEFT JOIN Departements d ON c.id_dept = d.id_dept
    LIMIT 5
""")
for row in cursor.fetchall():
    print(f"  {row[0]} (Age {row[3]}, {row[4]}) - {row[1]} from {row[2] or 'Unknown'}")

# Show regions
print("\nRegions in database:")
cursor.execute("SELECT code_region, nom_region FROM Regions ORDER BY code_region LIMIT 6")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")
print("  ...")

# Test the views
print("\nViews created:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
for row in cursor.fetchall():
    print(f"  - {row[0]}")

print("\nSample DeptRepresentation view:")
cursor.execute("""
    SELECT nom_dept, population_percentage, candidate_percentage, gap_percentage
    FROM DeptRepresentation
    WHERE candidate_count > 0
    ORDER BY gap_percentage DESC
    LIMIT 3
""")
for row in cursor.fetchall():
    print(f"  {row[0]}: pop={row[1]}%, cand={row[2]}%, gap={row[3]}%")

conn.close()
print("\n[OK] Verification complete!")
