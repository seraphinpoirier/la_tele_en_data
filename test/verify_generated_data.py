#!/usr/bin/env python3
"""Verify the generated JSON files match expected format."""

import json

print("VERIFICATION OF GENERATED DATA FILES")
print("=" * 60)

# Check departments data
print("\nDEPARTMENTS DATA (departments_data.json):")
with open('departments_data.json') as f:
    dept = json.load(f)
    print(f"  Total departments: {dept['metadata']['total_departments']}")
    print(f"  Total population: {dept['metadata']['total_population']:,}")
    print(f"  Total candidates: {dept['metadata']['total_candidates']}")
    print(f"  Generated: {dept['metadata']['generated_date']}")
    print(f"  Data source: {dept['metadata']['data_source']}")
    
    print("\n  Top 5 departments by candidates:")
    depts = sorted(
        dept['departments'].items(),
        key=lambda x: x[1]['candidate_count'],
        reverse=True
    )[:5]
    for dept_name, d in depts:
        print(f"    {dept_name}: {d['candidate_count']} candidates, {d['population_2023']:,} pop")

# Check regions data
print("\nREGIONS DATA (regions_data.json):")
with open('regions_data.json') as f:
    reg = json.load(f)
    print(f"  Total regions: {reg['metadata']['total_regions']}")
    print(f"  Total population: {reg['metadata']['total_population']:,}")
    print(f"  Total candidates: {reg['metadata']['total_candidates']}")
    print(f"  Generated: {reg['metadata']['generated_date']}")
    
    print("\n  Top 5 regions by candidates:")
    regions = sorted(
        reg['regions'].items(),
        key=lambda x: x[1]['candidate_count'],
        reverse=True
    )[:5]
    for region_name, r in regions:
        print(f"    {region_name}: {r['candidate_count']} candidates, {r['population_2023']:,} pop")

print("\n" + "=" * 60)
print("[OK] Verification complete - JSON files are valid!")
