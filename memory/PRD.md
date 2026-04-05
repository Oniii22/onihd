# PRD - PienoPerfetto - Fuel Price Finder

## Original Problem Statement
Rebuild an Italian fuel price comparison app (PienoPerfetto) with mobile-first design, modern animated styles, Italian UI language. Connect to existing MySQL database at 82.165.170.203 for live fuel station data.

## Architecture
- **Backend**: FastAPI (Python) → Remote MySQL via aiomysql
- **Frontend**: React + Tailwind CSS + Leaflet + Framer Motion
- **Database**: MySQL at 82.165.170.203 (materiali_db - stations & station_prices tables)
- **Hosting**: Emergent preview environment

## User Personas
- Italian drivers looking for cheapest fuel nearby
- Mobile-first users comparing fuel prices across stations in their city

## Core Requirements
- City autocomplete search (Italian cities)
- Fuel type filter (Gasolio, Benzina, GPL, Metano, etc.)
- Interactive Leaflet map with custom price markers
- Station list view sorted by price
- Cheapest station highlighted
- Google Maps navigation integration
- Mobile-optimized responsive design

## What's Been Implemented [2026-01-28]
### Backend (FastAPI)
- GET /api/healthz - Health check
- GET /api/fuel/cities?q= - City autocomplete search
- GET /api/fuel/fuels - List all fuel types
- GET /api/fuel/stations?comune=&fuel= - List stations with prices
- All endpoints connect to remote MySQL via aiomysql async driver

### Frontend (React)
- Full-bleed Leaflet map as primary canvas (CARTO light tiles)
- Glassmorphism floating search bar with autocomplete
- Fuel type dropdown filter with popular/other categories
- Map view with custom DivIcon price markers (white/green/selected states)
- Marker clustering for dense areas
- List view with animated slide-up panel (framer-motion spring animation)
- Station cards with price display (Italian comma formatting), address, Navigate button
- Station detail bottom card on map marker selection
- Floating pill toggle for List/Map switch (black pill, white text)
- Cheapest station highlight ("Migliore" badge, green accent)
- Staggered CSS animations for list items
- Work Sans + JetBrains Mono typography

### Testing
- 100% backend test pass rate
- 100% frontend test pass rate
- 100% integration test pass rate

## Backlog
- P1: GPS-based "stations near me" feature
- P2: Favorites / bookmarked stations
- P2: Price history charts
- P3: Price alerts / notifications
- P3: Dark mode toggle
