# PRD - PienoPerfetto - Fuel Price Finder

## Original Problem Statement
Rebuild an Italian fuel price comparison app (PienoPerfetto) with mobile-first design, modern animated styles, Italian UI language. Connect to existing MySQL database at 82.165.170.203 for live fuel station data.

## Architecture
- **Backend**: FastAPI (Python) → Remote MySQL via aiomysql
- **Frontend**: React + Tailwind CSS + Leaflet + Framer Motion
- **Database**: MySQL at 82.165.170.203 (materiali_db - stations & station_prices tables)

## What's Been Implemented
### Backend (FastAPI)
- GET /api/healthz - Health check
- GET /api/fuel/cities?q= - City autocomplete search
- GET /api/fuel/fuels - List all fuel types
- GET /api/fuel/stations?comune=&fuel= - List stations with prices

### Frontend (React)
- Full-bleed Leaflet map (edge-to-edge, no attribution bar)
- Glassmorphism floating search bar with autocomplete
- Fuel type dropdown filter
- Map with custom DivIcon price markers + clustering
- List view with animated slide-up panel (draggable to close)
- Station cards with prices, Navigate button
- Station detail bottom card on map marker selection
- Floating pill toggle for List/Map switch (emerald green)
- Cheapest station highlight ("Migliore" badge)
- Loading overlay "Aggiornamento prezzi..." when changing fuel type (500ms min)
- Pins refresh with correct data on fuel change
- AdSense ad placeholders (detail card + every 3 stations in list)
- Clicking fuel/city controls closes list view
- PWA: manifest.json, service worker, install prompt
- Safe area support for notched phones
- 100dvh for iOS Safari full screen
- Status bar theme-color matching app

## Backlog
- P1: GPS-based "stations near me" feature
- P2: Favorites / bookmarked stations
- P2: Price history charts
- P3: Dark mode toggle
