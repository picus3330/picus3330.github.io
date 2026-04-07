# 🗺️ Ukraine War Map

Interactive dark-themed war map showing the current frontline in Ukraine.  
Data is fetched daily from [cyterat/deepstate-map-data](https://github.com/cyterat/deepstate-map-data) (sourced from [DeepStateMap.live](https://deepstatemap.live)) via GitHub Actions.

![Ukraine War Map Preview](https://img.shields.io/badge/data-DeepStateMap%20OSINT-red?style=flat-square) ![Auto Update](https://img.shields.io/badge/update-daily%2004%3A30%20UTC-green?style=flat-square)

---

## Setup (5 minutes)

### 1. Fork or clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/ukraine-war-map.git
cd ukraine-war-map
```

### 2. Enable GitHub Pages

Go to **Settings → Pages → Source: Deploy from branch → `main` → `/` (root)** → Save.

Your map will be live at `https://YOUR_USERNAME.github.io/ukraine-war-map/`

### 3. Fetch initial data

Go to **Actions → Update Frontline Data → Run workflow** (manually trigger it once).  
After ~30 seconds the first `data/frontline.geojson` will be committed.

From then on it updates automatically every day at **04:30 UTC**.

---

## How it works

```
GitHub Actions (daily 04:30 UTC)
    ↓
Fetches deepstatemap_data_YYYY-MM-DD.geojson
from cyterat/deepstate-map-data
    ↓
Saves to data/frontline.geojson in this repo
    ↓
index.html fetches data/frontline.geojson
(same origin → no CORS issues)
    ↓
Leaflet renders occupied polygons on dark map
```

## File structure

```
ukraine-war-map/
├── index.html                          # Main map page
├── data/
│   ├── frontline.geojson               # Updated daily by GitHub Action
│   └── meta.json                       # Date/source metadata
└── .github/
    └── workflows/
        └── update-frontline.yml        # Daily update workflow
```

## Data Sources

- **Frontline polygons**: [cyterat/deepstate-map-data](https://github.com/cyterat/deepstate-map-data) — daily GeoJSON snapshots of Russian-occupied territory sourced from DeepStateMap.live OSINT
- **Map tiles**: [CARTO Dark Matter](https://carto.com/basemaps/)
- **War day counter**: calculated from 2022-02-24

## Local development

Just open `index.html` via a local server (needed for `fetch()` to work):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
