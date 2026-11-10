# 📂 Project Structure Guide

## Quick Reference

### 🏠 Root Directory
**Production files** - Everything needed to run the website

- `index.html` - Main interactive website
- `departments_data.json` - Department statistics (auto-generated)
- `regions_data.json` - Region statistics (auto-generated)
- `Donnees_KL.db` - SQLite database with all source data
- `Donnees_KL.sql` - Database schema
- `QUICKSTART.md` - User quick-start guide
- `README.md` - Project overview

### 📁 scripts/
**Data generation and management**

```
scripts/
├── load_data.py           → Import data from Excel/CSV into SQLite
├── generate_data_from_db.py → Convert database to JSON
└── update_data.py         → Run both scripts (recommended)
```

**When to use:**
- Run `python scripts/update_data.py` after adding candidates
- Run `python scripts/load_data.py` after changing source Excel files
- `generate_data_from_db.py` is called automatically by `update_data.py`

### 🧪 test/
**Testing, validation, and debugging**

```
test/
├── verify_database.py        → Check database integrity
├── verify_generated_data.py  → Validate JSON output
├── verify_pipeline.py        → End-to-end validation
└── test-map.html            → Standalone map debug page
```

**When to use:**
- Run after data imports to verify correctness
- Use `test-map.html` in browser to debug map issues
- Verify pipeline with: `python test/verify_pipeline.py`

### 📖 docs/
**Development and technical documentation**

```
docs/
├── README_DATABASE.md    → Database schema & queries
├── README_MAP.md        → Map implementation details
└── RESTRUCTURING.md     → Code restructuring history
```

**Audience:** Developers maintaining the codebase

### .github/agents/
**Custom agent definitions** (VS Code Copilot)

Custom agents for:
- architecture
- code
- documentation
- orchestrator
- test

## Common Tasks

### 🔄 Regenerate Data After Changes
```bash
cd la_tele_en_data
python scripts/update_data.py
python -m http.server 8000
# Visit http://localhost:8000
```

### ✅ Verify Everything Works
```bash
python test/verify_pipeline.py
```

### 🐛 Debug Map Issues
1. Open `test/test-map.html` in browser at http://localhost:8000/test/test-map.html
2. Check browser console (F12)
3. See logged data and errors

### 📊 Check Database
```bash
python test/verify_database.py
```

## File Organization Rationale

| Why Here | Folder | Details |
|----------|--------|---------|
| **Production** | Root | Always needed to run the site |
| **Build** | scripts/ | Only needed when updating data |
| **Quality Assurance** | test/ | Development & validation only |
| **Reference** | docs/ | Documentation for maintainers |

## Size Overview

- **Database**: ~40 KB (contains all source data)
- **JSON files**: ~20 KB each (fast browser loading)
- **Excel files**: ~100 KB each (original sources, kept for data integrity)
- **CSS/JS in index.html**: ~30 KB (embedded for simplicity)

## Maintenance Notes

- ✅ Always keep Excel files (source of truth)
- ✅ Keep scripts/ for future data updates
- ✅ Run verification after any data change
- ✅ Update CHANGES.md when making significant changes
- ✅ Keep docs/ current for new developers

## For New Contributors

1. Read `QUICKSTART.md` to understand the project
2. Review `docs/README_MAP.md` for technical details
3. Check `scripts/` to understand data flow
4. Use `test/` folder to verify changes
5. See `docs/README_DATABASE.md` for schema details
