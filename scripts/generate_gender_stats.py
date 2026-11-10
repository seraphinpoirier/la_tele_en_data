import sqlite3
import json

def generate_gender_stats():
    """Generate H/F statistics for the 'Et les femmes ?' section"""
    conn = sqlite3.connect('Donnees_KL.db')
    cursor = conn.cursor()
    
    stats = {}
    
    # 1. Overall H/F ratio
    cursor.execute("""
        SELECT genre, COUNT(*) as count
        FROM Candidats
        WHERE genre IS NOT NULL
        GROUP BY genre
    """)
    overall = dict(cursor.fetchall())
    stats['overall'] = {
        'H': overall.get('H', 0),
        'F': overall.get('F', 0),
        'total': overall.get('H', 0) + overall.get('F', 0)
    }
    
    # 2. H/F ratio where ori (Original) == 1
    cursor.execute("""
        SELECT genre, COUNT(*) as count
        FROM Candidats
        WHERE genre IS NOT NULL AND ori = 1
        GROUP BY genre
    """)
    ori = dict(cursor.fetchall())
    stats['ori'] = {
        'H': ori.get('H', 0),
        'F': ori.get('F', 0),
        'total': ori.get('H', 0) + ori.get('F', 0)
    }
    
    # 3. H/F ratio where pot (Pot luck) == 1
    cursor.execute("""
        SELECT genre, COUNT(*) as count
        FROM Candidats
        WHERE genre IS NOT NULL AND pot = 1
        GROUP BY genre
    """)
    pot = dict(cursor.fetchall())
    stats['pot'] = {
        'H': pot.get('H', 0),
        'F': pot.get('F', 0),
        'total': pot.get('H', 0) + pot.get('F', 0)
    }
    
    # 4. H/F ratio where place == 1 (finalists/winners)
    cursor.execute("""
        SELECT genre, COUNT(*) as count
        FROM Candidats
        WHERE genre IS NOT NULL AND place = 1
        GROUP BY genre
    """)
    place = dict(cursor.fetchall())
    stats['place'] = {
        'H': place.get('H', 0),
        'F': place.get('F', 0),
        'total': place.get('H', 0) + place.get('F', 0)
    }
    
    conn.close()
    
    # Save to JSON
    output = {
        'metadata': {
            'generated': True
        },
        'stats': stats
    }
    
    with open('gender_stats.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print("Generated gender_stats.json")
    print(f"  Overall: {stats['overall']['H']} H, {stats['overall']['F']} F (total: {stats['overall']['total']})")
    print(f"  Original: {stats['ori']['H']} H, {stats['ori']['F']} F (total: {stats['ori']['total']})")
    print(f"  Pot luck: {stats['pot']['H']} H, {stats['pot']['F']} F (total: {stats['pot']['total']})")
    print(f"  Place 1 (Winners): {stats['place']['H']} H, {stats['place']['F']} F (total: {stats['place']['total']})")

if __name__ == '__main__':
    generate_gender_stats()
