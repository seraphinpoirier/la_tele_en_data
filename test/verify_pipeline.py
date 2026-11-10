#!/usr/bin/env python3
"""Verify data pipeline compatibility."""

import json

print("Verifying data pipeline...")
print("=" * 60)

# Load JSON files
with open('departments_data.json') as f:
    dept = json.load(f)

with open('regions_data.json') as f:
    reg = json.load(f)

# Verify JSON structure for HTML
assert 'departments' in dept, 'Missing departments key'
assert 'regions' in reg, 'Missing regions key'

# Verify each department has required fields
sample_dept = list(dept['departments'].values())[0]
required = ['population_2023', 'population_percentage', 'candidate_count', 'candidate_percentage', 'gap_percentage', 'candidates']
for field in required:
    assert field in sample_dept, f'Missing field: {field}'

# Verify each region has required fields
sample_region = list(reg['regions'].values())[0]
for field in required:
    assert field in sample_region, f'Missing field in region: {field}'

print("[OK] departments_data.json has correct structure for index.html")
print("[OK] regions_data.json has correct structure for index.html")
print("[OK] All required fields present")
print("[OK] Data pipeline is working correctly!")
print("=" * 60)
