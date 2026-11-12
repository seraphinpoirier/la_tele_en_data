"""Generate age distributions and first-elimination statistics from SQLite."""

import json
import sqlite3
from collections import Counter
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent.parent


def age_stats(candidates):
    """Count known ages overall and by gender, with matching averages."""
    groups = {'all': [], 'F': [], 'H': []}
    for candidate in candidates:
        age = candidate['age']
        if age is None:
            continue
        age = int(age)
        groups['all'].append(age)
        if candidate['genre'] in ('F', 'H'):
            groups[candidate['genre']].append(age)
    return {
        group: {
            'counts': dict(sorted(Counter(ages).items())),
            'total': len(ages),
            'average': sum(ages) / len(ages) if ages else None,
        }
        for group, ages in groups.items()
    }


def first_outs(conn):
    """Select the worst-placed non-abandonment from each eligible tribe."""
    conn.row_factory = sqlite3.Row
    seasons = conn.execute("""
        SELECT saison FROM Candidats
        GROUP BY saison HAVING COUNT(DISTINCT tribu) IN (2, 3)
    """).fetchall()
    result = []
    for season in seasons:
        tribes = conn.execute(
            "SELECT DISTINCT tribu FROM Candidats WHERE saison = ? AND tribu IS NOT NULL",
            (season['saison'],),
        ).fetchall()
        for tribe in tribes:
            candidates = conn.execute("""
                SELECT saison, tribu, nom, genre, age, place FROM Candidats
                WHERE saison = ? AND tribu = ? AND (aban = 0 OR aban IS NULL) AND place IS NOT NULL
                ORDER BY place DESC
            """, (season['saison'], tribe['tribu'])).fetchall()
            if not candidates or (len(candidates) > 1 and candidates[0]['place'] == candidates[1]['place']):
                raise ValueError(f"Cannot identify one first out for {season['saison']} / {tribe['tribu']}")
            result.append(candidates[0])
    return result


def generate_candidate_stats():
    with sqlite3.connect(PROJECT_DIR / 'Donnees_KL.db') as conn:
        conn.row_factory = sqlite3.Row
        candidates = conn.execute("SELECT nom, saison, place, genre, age FROM Candidats ORDER BY saison, nom").fetchall()
        orientation = conn.execute("SELECT nom, saison, place, genre, age FROM Candidats WHERE ori = 1 ORDER BY saison, nom").fetchall()
        eliminated = first_outs(conn)
    gender = Counter(candidate['genre'] for candidate in eliminated)
    output = {
        'ages': {'all': age_stats(candidates), 'orientation': age_stats(orientation)},
        'age_candidates': {
            'all': [dict(candidate) for candidate in candidates if candidate['age'] is not None],
            'orientation': [dict(candidate) for candidate in orientation if candidate['age'] is not None],
        },
        'first_outs': {
            'gender': {
                'F': gender['F'], 'H': gender['H'],
                'unknown': len(eliminated) - gender['F'] - gender['H'],
            },
            'ages': age_stats(eliminated),
            'candidates': [dict(candidate) for candidate in eliminated],
        },
    }
    with open(PROJECT_DIR / 'candidate_stats.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated candidate_stats.json ({len(eliminated)} first outs)")
