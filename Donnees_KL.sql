-- Koh-Lanta Data Analysis Database
-- Schema for storing candidate, department, and region information

-- Regions table
CREATE TABLE IF NOT EXISTS Regions (
    id_region INTEGER PRIMARY KEY,
    code_region TEXT UNIQUE NOT NULL,
    nom_region TEXT NOT NULL
);

-- Departments table (enriched with population data)
CREATE TABLE IF NOT EXISTS Departements (
    id_dept INTEGER PRIMARY KEY AUTOINCREMENT,
    code_dept TEXT UNIQUE NOT NULL,
    nom_dept TEXT NOT NULL,
    id_region INTEGER NOT NULL,
    superf REAL,                      -- Surface area
    population_2023 INTEGER,          -- Population municipale 2023 (p23_pop)
    candidates_count INTEGER DEFAULT 0,
    FOREIGN KEY (id_region) REFERENCES Regions(id_region)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS Candidats (
    id_candidat INTEGER PRIMARY KEY AUTOINCREMENT,
    saison TEXT NOT NULL,
    genre TEXT,                       -- 'M' or 'F'
    nom TEXT NOT NULL,
    age INTEGER,
    id_dept INTEGER,
    tribu TEXT,                       -- Tribe/Team
    amb BOOLEAN,                      -- Ambassador?
    ori BOOLEAN,                      -- Original?
    aban BOOLEAN,                     -- Abandoned?
    pot BOOLEAN,                      -- Pot luck?
    place INTEGER,                    -- Final placement
    FOREIGN KEY (id_dept) REFERENCES Departements(id_dept)
);

-- Statistics view: Department representation
CREATE VIEW IF NOT EXISTS DeptRepresentation AS
SELECT 
    d.id_dept,
    d.code_dept,
    d.nom_dept,
    d.population_2023,
    COUNT(c.id_candidat) as candidate_count,
    ROUND(100.0 * d.population_2023 / (SELECT SUM(population_2023) FROM Departements), 2) as population_percentage,
    ROUND(100.0 * COUNT(c.id_candidat) / (SELECT COUNT(*) FROM Candidats), 2) as candidate_percentage,
    ROUND(100.0 * COUNT(c.id_candidat) / (SELECT COUNT(*) FROM Candidats) - 
          100.0 * d.population_2023 / (SELECT SUM(population_2023) FROM Departements), 2) as gap_percentage
FROM Departements d
LEFT JOIN Candidats c ON d.id_dept = c.id_dept
GROUP BY d.id_dept, d.code_dept, d.nom_dept, d.population_2023;

-- Statistics view: Region representation
CREATE VIEW IF NOT EXISTS RegionRepresentation AS
SELECT 
    r.id_region,
    r.code_region,
    r.nom_region,
    SUM(d.population_2023) as population_2023,
    COUNT(c.id_candidat) as candidate_count,
    ROUND(100.0 * SUM(d.population_2023) / (SELECT SUM(population_2023) FROM Departements), 2) as population_percentage,
    ROUND(100.0 * COUNT(c.id_candidat) / (SELECT COUNT(*) FROM Candidats), 2) as candidate_percentage,
    ROUND(100.0 * COUNT(c.id_candidat) / (SELECT COUNT(*) FROM Candidats) - 
          100.0 * SUM(d.population_2023) / (SELECT SUM(population_2023) FROM Departements), 2) as gap_percentage
FROM Regions r
LEFT JOIN Departements d ON r.id_region = d.id_region
LEFT JOIN Candidats c ON d.id_dept = c.id_dept
GROUP BY r.id_region, r.code_region, r.nom_region;

-- Candidate details by season
CREATE VIEW IF NOT EXISTS CandidatsBySeason AS
SELECT 
    saison,
    COUNT(*) as candidate_count,
    GROUP_CONCAT(nom, ', ') as candidates,
    GROUP_CONCAT(DISTINCT d.nom_dept, ', ') as departments
FROM Candidats c
LEFT JOIN Departements d ON c.id_dept = d.id_dept
GROUP BY saison
ORDER BY saison;
