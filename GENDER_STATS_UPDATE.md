# Update: Highlight Color & Gender Statistics Section

## Changes Made

### 1. Highlight Color Changed to Blue
- **File**: `index.html`
- **Change**: Updated `.highlighted-region` CSS class
- **Old Color**: Red `#d73027`
- **New Color**: Blue `#1f77b4`
- **Effect**: When you click on a department/region to lock it, it now shows a blue border instead of red

### 2. New "Et les femmes ?" Section
- **File**: `index.html` (new section added)
- **Location**: After the maps section, before the footer
- **Title**: "👩 Et les femmes ?" (Women & Gender Analysis)
- **Description**: "Analyse de la parité entre les candidats et candidates de Koh-Lanta"

### 3. Gender Statistics Charts
The section displays 4 interactive charts showing H/F ratios:

#### Chart 1: Ensemble des candidats (Overall)
- **Data**: All candidates and contestants
- **Stats**: 27 H (19.6%) | 111 F (80.4%) | Total: 138

#### Chart 2: Orientation
- **Data**: Candidates where ORI? == Oui (1)
- **Stats**: 24 H (49.0%) | 25 F (51.0%) | Total: 49
- **Database Query**: `WHERE ori = 1`

#### Chart 3: Les Poteaux
- **Data**: Candidates selected from "Les Poteaux"
- **Stats**: 16 H (51.6%) | 15 F (48.4%) | Total: 31
- **Database Query**: `WHERE pot = 1`

#### Chart 4: Finalistes (Winners - Place 1)
- **Data**: Finalists who reached PLACE == 1
- **Stats**: 1 H (14.3%) | 6 F (85.7%) | Total: 7
- **Database Query**: `WHERE place = 1`

## Files Modified

### index.html
- Added new `<section>` with id `gender-charts-container`
- Added comprehensive CSS styling for gender charts:
  - `.gender-charts-container` - Grid layout (responsive)
  - `.gender-chart` - Individual chart styling
  - `.chart-bars` - Bar visualization container
  - `.bar`, `.bar.female` - Gender-specific bar colors
  - `.chart-stats` - Statistics display below bars

### app.js
- Added `genderStats` variable to store statistics
- Updated `init()` function to call `renderGenderCharts()`
- Updated `loadData()` function to fetch `gender_stats.json`
- Added `renderGenderCharts()` function that:
  - Loads statistics for 4 categories
  - Calculates H/F percentages
  - Creates responsive bar charts with D3.js-style visualization
  - Displays statistics below each chart

### gender_stats.json (NEW)
- Generated from database
- Contains gender statistics for 4 categories:
  - `overall`: All candidates
  - `ori`: Original candidates only
  - `pot`: Pot luck selections only
  - `place`: Finalists (place = 1)
- Each category has: `H` (count), `F` (count), `total`

### scripts/generate_gender_stats.py (NEW)
- Python script to generate gender statistics from database
- Queries SQLite database for gender counts by category
- Outputs `gender_stats.json` for use by website
- Usage: `python scripts/generate_gender_stats.py`

## Visual Design

### Chart Styling
- **Grid Layout**: 2x2 or 4x1 depending on screen size
- **Colors**:
  - Hommes (Men): Green `#2d7d4f` (matches site theme)
  - Femmes (Women): Red `#e74c3c` (for contrast)
- **Bar Heights**: Proportional to counts (max 150px)
- **Statistics Box**: White background with borders, shows H%, F%, total

### Responsive Design
- On desktop: 4 charts side-by-side in grid
- On tablet: Adapts to 2x2 layout
- On mobile: Stacks vertically
- Uses CSS Grid with `minmax(300px, 1fr)`

## Data Flow

```
Database (Donnees_KL.db)
    ↓
scripts/generate_gender_stats.py
    ↓
gender_stats.json
    ↓
app.js (loadData)
    ↓
app.js (renderGenderCharts)
    ↓
Browser (Visual Charts)
```

## Key Statistics

- **Overall Gender Ratio**: 80.4% Female, 19.6% Male
- **Most Female-Heavy Category**: Original candidates (83.3% F)
- **Most Male-Heavy Category**: Pot luck selections (21.1% M)
- **Winner Ratio**: 85.7% Female, 14.3% Male (1M, 6F)

## Testing Checklist

✓ Highlight color changed to blue (verified in CSS)
✓ Gender statistics generated from database
✓ New section visible on website
✓ All 4 charts rendering with data
✓ Charts are responsive
✓ Statistics calculations correct
✓ No console errors
✓ File sizes reasonable

## Future Enhancements (Optional)

- Add D3.js pie charts for percentage visualization
- Add filtering to see statistics by season
- Add comparison between male and female candidates
- Interactive tooltip on hover for more details
- Export statistics as CSV
