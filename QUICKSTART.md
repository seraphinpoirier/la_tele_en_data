# 🗺️ Quick Start Guide - Interactive France Map

## ⚡ 30 Seconds to Start

### Option 1: Direct Open (Simplest)
1. Navigate to: `la_tele_en_data/`
2. Double-click: `index.html`
3. 🎉 Map opens in your browser!

### Option 2: Local Server (Recommended)
```bash
cd la_tele_en_data
python -m http.server 8000
```
Then open: http://localhost:8000

---

## 🎮 Using the Map

| Action | Result |
|--------|--------|
| **Hover over department** | See tooltips with statistics |
| **Continue hovering** | Sidebar updates with full candidate list |
| **Zoom in/out** | Use mouse wheel to adjust detail level |
| **Consult legend** | Understand the color coding |

---

## 🎨 Understanding the Colors

### Green = More Candidates Than Population %
- Darker green = Stronger over-representation
- Example: **Paris** (+2.79%) has many more candidates than its population share

### Red = Fewer Candidates Than Population %
- Darker red = Stronger under-representation  
- Example: **Val-d'Oise** (-1.43%) has fewer candidates than its population share

### Gray = No Data
- Departments without candidates in the dataset

---

## 📊 What the Map Shows

**For each department:**
- 📍 **Position**: Geographic location
- 🎨 **Color**: Representation gap
- 👥 **Hover info**: 
  - Population %
  - Candidate %
  - Gap (%)
  - List of candidate names

---

## 🔧 If Something Doesn't Work

| Problem | Solution |
|---------|----------|
| Map doesn't load | Check internet connection (GeoJSON loads from GitHub) |
| No data shown | Verify `departments_data.json` exists in same folder |
| Weird characters | Data was saved with UTF-8 encoding (should be fine) |
| Blank sidebar | Try hovering over a department again |

---

## 📚 Learn More

See `README_MAP.md` for:
- Detailed feature explanations
- How to regenerate data
- Technology stack details
- Data interpretation guide

---

## ✨ Pro Tips

1. **Bookmark the page** for quick access
2. **Use fullscreen** (F11) for better visibility
3. **Hover slowly** to see all tooltips
4. **Check the sidebar** for complete candidate lists
5. **Read the legend** to interpret colors correctly

---

## 🎯 Example Analysis

**Paris (darker red region)**
- Population: 3.09%
- Candidates: 5.88%
- Gap: -2.79% (over-represented)
- ✅ Paris sends disproportionately MORE candidates

**Val-d'Oise (lighter red region)**
- Population: 1.88%
- Candidates: 0.45%
- Gap: +1.43% (under-represented)
- ⚠️ Val-d'Oise sends disproportionately FEWER candidates

---

**Questions?** Check the console (F12) for any error messages or see README_MAP.md
