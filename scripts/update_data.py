#!/usr/bin/env python3
"""
Update data pipeline: Rebuild JSON files from database instead of Excel.

This script replaces process_data.py and process_regions.py which read from Excel files.
Now data flows: Excel/CSV -> Donnees_KL.db -> JSON (via generate_data_from_db.py)
"""

import subprocess
import sys
from pathlib import Path

def main():
    """Run data generation from database."""
    script_dir = Path(__file__).parent
    generate_script = script_dir / "generate_data_from_db.py"
    
    if not generate_script.exists():
        print(f"[ERROR] {generate_script.name} not found")
        return 1
    
    print("Updating data from database...")
    result = subprocess.run([sys.executable, str(generate_script)], cwd=script_dir)
    
    if result.returncode == 0:
        print("\n[OK] Data update complete!")
        print("Files regenerated:")
        print("  - departments_data.json")
        print("  - regions_data.json")
        print("  - tribes_data.json")
        print("  - gender_stats.json")
        print("  - candidate_stats.json")
    
    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
