# Carte Interactive de France - Analyse Démographique vs Candidats

## 📊 Description du Projet

Ce projet crée une **carte interactive de France** qui visualise l'écart entre :
- **X**: La proportion de population dans chaque département (données 2023)
- **Z**: La proportion de candidats dans chaque département (données Kohlanta)
- **Gap = X - Z**: L'écart entre ces deux proportions

### Codes Couleurs

- 🔴 **Rouge** (Gap négatif): Les départements avec **moins de candidats** que leur proportion de population
  - `#fee5d9`: Très sous-représenté (< -2%)
  - `#fcae91`: Sous-représenté (-2% à -0.5%)
  - `#fb6a4a`: Moyennement sous-représenté (-0.5% à 0%)

- 🟢 **Vert** (Gap positif): Les départements avec **plus de candidats** que leur proportion de population
  - `#e5f5e0`: Léger sur-représenté (0% à 0.5%)
  - `#a1d99b`: Moyennement sur-représenté (0.5% à 2%)
  - `#31a354`: Très sur-représenté (> 2%)

- ⚫ **Gris**: Pas de données disponibles

## 🚀 Comment Utiliser

### Option 1: Ouvrir directement le fichier HTML

1. Ouvrez `index.html` dans un navigateur web
2. La carte s'affichera automatiquement avec les données

### Option 2: Servir via un serveur local

```bash
# Avec Python 3
python -m http.server 8000

# Puis accédez à: http://localhost:8000
```

### Utilisation de la carte

- **Survolez** un département pour voir son nom et ses statistiques
- **Cliquez** (ou continuez à survoler) pour voir la liste des candidats dans la barre latérale
- **Consultez la légende** pour interpréter les couleurs
- **Zoomez/Dézoomez** avec la molette de la souris

## 📁 Fichiers du Projet

### `index.html` (15.5 KB)
- Application web interactive avec carte Leaflet.js
- Interface responsive avec sidebar d'informations
- Tooltips au survol avec détails des candidats
- Légende interactive expliquant le code couleur

### `departments_data.json` (26.3 KB)
- Données complètes des 100 départements français
- Pour chaque département:
  - Population 2023 (données INSEE)
  - Pourcentage de population nationale
  - Nombre de candidats
  - Pourcentage de candidats
  - Écart (Gap)
  - Liste complète des noms de candidats

### `process_data.py` (3.5 KB)
- Script Python pour traiter les données Excel
- Lit: `POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx` (colonne p23_pop)
- Lit: `donnees_kohlanta.xlsx` (colonnes DEPARTEMENT, NOM)
- Génère: `departments_data.json`

## 🔄 Régénérer les Données

Si vous mettez à jour les fichiers Excel source, régénérez les données:

```bash
cd la_tele_en_data
python process_data.py
```

**Prérequis:**
```bash
pip install pandas openpyxl
```

## 📊 Statistiques Globales

- **Population totale France**: 68,094,280
- **Total candidats**: 221
- **Nombre de départements**: 100 (dont 75 avec au moins 1 candidat)
- **Date des données**: 2026-11-10

## 🌐 Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Cartographie**: Leaflet.js v1.9.4
- **Données géographiques**: TopoJSON via GitHub (gregoiredavid/france-geojson)
- **Backend données**: Python avec Pandas & OpenPyXL
- **Design**: Responsive, compatible mobile et desktop

## 📈 Interprétation des Résultats

### Exemple 1: Gap Négatif (-0.38% - Martinique)
- Population nationale: 0.53%
- Candidats: 0.9%
- **Interprétation**: La Martinique a une plus forte représentation de candidats que sa part de population

### Exemple 2: Gap Positif (1.05% - Vendée)
- Population nationale: 1.05%
- Candidats: 0.0%
- **Interprétation**: La Vendée a une plus faible représentation de candidats que sa part de population

## ⚠️ Limitations & Remarques

- Les données sont basées sur les noms de départements dans les Excel sources
- Certains candidats pourraient avoir des noms avec des accents mal encodés
- Les "régions d'outre-mer" sont incluses dans le décompte total
- L'encodage UTF-8 est utilisé pour les caractères accentués

## 🔗 Sources de Données

- **Population**: `POPULATION_MUNICIPALE_DEPARTEMENT_FRANCE.xlsx`
  - Colonne utilisée: `p23_pop` (2023)
  - Source: INSEE (Institut National de la Statistique et des Études Économiques)
  
- **Candidats**: `donnees_kohlanta.xlsx`
  - Colonnes utilisées: DEPARTEMENT, NOM
  - Source: Données Kohlanta

## 🛠️ Maintenance et Mise à Jour

### Pour mettre à jour avec de nouvelles données:
1. Remplacez les fichiers Excel source
2. Exécutez `python process_data.py`
3. Rechargez la page HTML

### Pour personnaliser les couleurs:
Modifiez la fonction `getColor()` dans `index.html` pour ajuster les seuils de couleur

### Pour ajouter plus d'informations:
Modifiez `createTooltip()` et `showDepartmentInfo()` dans `index.html`

## 📞 Support

En cas de problème:
1. Vérifiez que les fichiers Excel source sont présents
2. Vérifiez la connexion internet (pour charger le GeoJSON)
3. Ouvrez la console du navigateur (F12) pour voir les erreurs
4. Assurez-vous que `departments_data.json` est valide

---

**Créé avec ❤️ pour l'analyse démographique des candidats**
