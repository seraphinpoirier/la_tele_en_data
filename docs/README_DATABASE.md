# Donnees_KL Database

A SQLite database containing comprehensive data about Koh-Lanta TV show candidates and their geographic representation across French departments and regions.

## Files

- **Donnees_KL.db** - SQLite database (auto-generated, ~40KB)
- **Donnees_KL.sql** - Database schema definition
- **load_data.py** - Python script to populate the database from source files
- **verify_database.py** - Script to verify database contents and view samples

## Database Structure

### Tables

#### `Regions` (18 rows)
- `id_region` (INTEGER, PRIMARY KEY)
- `code_region` (TEXT UNIQUE)
- `nom_region` (TEXT)

French administrative regions (01-11 for mainland, 01-06 for outre-mer).

#### `Departements` (100 rows)
- `id_dept` (INTEGER, PRIMARY KEY AUTOINCREMENT)
- `code_dept` (TEXT UNIQUE)
- `nom_dept` (TEXT)
- `id_region` (INTEGER, FOREIGN KEY)
- `superf` (REAL) - Surface area
- `population_2023` (INTEGER) - Municipal population 2023
- `candidates_count` (INTEGER) - Number of candidates from this department

Data enriched from:
- `POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx` (column p23_pop)
- `departements-france.csv`

#### `Candidats` (221 rows)
- `id_candidat` (INTEGER, PRIMARY KEY AUTOINCREMENT)
- `saison` (TEXT) - Season name
- `genre` (TEXT) - 'M' or 'F'
- `nom` (TEXT) - Candidate name
- `age` (INTEGER)
- `id_dept` (INTEGER, FOREIGN KEY)
- `tribu` (TEXT) - Team/Tribe
- `amb` (BOOLEAN) - Ambassador?
- `ori` (BOOLEAN) - Original?
- `aban` (BOOLEAN) - Abandoned?
- `pot` (BOOLEAN) - Pot luck?
- `place` (INTEGER) - Final placement

Data from: `donnees_kohlanta.xlsx`

### Views

#### `DeptRepresentation`
Shows candidate representation gaps at department level:
- `nom_dept`
- `population_2023`
- `candidate_count` - Number of candidates from this department
- `population_percentage` - % of France's population
- `candidate_percentage` - % of all candidates
- `gap_percentage` - Difference (positive = overrepresented, negative = underrepresented)

#### `RegionRepresentation`
Same as DeptRepresentation but aggregated to regional level.

#### `CandidatsBySeason`
Groups candidates by season:
- `saison`
- `candidate_count`
- `candidates` - Comma-separated list of names
- `departments` - Unique departments represented

## Usage Examples

### Query top 10 most represented departments
```sql
SELECT nom_dept, candidates_count, gap_percentage
FROM DeptRepresentation
ORDER BY gap_percentage DESC
LIMIT 10;
```

### Query all candidates from a specific department
```sql
SELECT nom, age, saison, genre, tribu
FROM Candidats
WHERE id_dept = (SELECT id_dept FROM Departements WHERE nom_dept = 'Paris')
ORDER BY saison;
```

### Query region statistics
```sql
SELECT nom_region, 
       population_2023, 
       candidate_count,
       ROUND(population_percentage, 2) as pop_pct,
       ROUND(candidate_percentage, 2) as cand_pct,
       ROUND(gap_percentage, 2) as gap_pct
FROM RegionRepresentation
ORDER BY gap_percentage DESC;
```

### Export candidate list with details
```sql
SELECT c.nom, c.age, c.genre, c.saison, d.nom_dept, r.nom_region
FROM Candidats c
LEFT JOIN Departements d ON c.id_dept = d.id_dept
LEFT JOIN Regions r ON d.id_region = r.id_region
ORDER BY c.saison, c.nom;
```

## Data Statistics

- **Total Candidates**: 221
- **Departments with Candidates**: 68 out of 100
- **Average Candidates per Department**: 2.21
- **Seasons**: 10 (from "4 Terres" to "Totem Maudit")

### Top Departments by Candidates
1. Paris (13)
2. Bouches-du-Rhône (10)
3. Hauts-de-Seine (10)
4. Gironde (9)
5. Nord (9)

### Candidates by Season
- 4 Terres: 24
- Armes Secrètes: 21
- Fidji: 21
- Guerre des Chefs: 21
- La Tribu Maudite: 24
- Le Feu Sacré: 20
- Les Chasseurs d'Immunité: 22
- Reliques du destin: 20
- Revanche des 4 Terres: 24
- Totem Maudit: 24

## Building the Database

To rebuild the database from source files:

```bash
python load_data.py
```

Requirements:
- Python 3.7+
- openpyxl (for Excel parsing)

The script will:
1. Copy source files from OneDrive to temp directory (handles file locks)
2. Parse Excel and CSV files
3. Create SQLite schema
4. Import all data
5. Calculate candidate counts per department
6. Display summary statistics

## File Locations

All files should be in the same directory:
- `C:\Users\caren\OneDrive\Bureau\projet_kl\la_tele_en_data\`

Source data files (auto-copied from here):
- `donnees_kohlanta.xlsx` - Candidate information
- `POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx` - Population data
- `departements-france.csv` - Department-region mapping

## Notes

- First candidate (Franҫoise) has no department assigned ("Belgique" - outside France)
- Some character encoding issues with accents in output; SQL queries return correct data
- Database uses SQLite 3.x format, compatible with Python sqlite3, DBeaver, and web frameworks
- All percentages calculated at query time from raw counts for accuracy
