# PRD - Fuel Price Finder Deployment Guide

## Original Problem Statement
User wants deployment instructions to run their Fuel Price Finder app on an Ubuntu VPS for public use.

## App Architecture
- **Monorepo**: pnpm workspaces (TypeScript)
- **Frontend**: React + Vite + Tailwind CSS + Leaflet maps (`artifacts/fuel-finder`)
- **Backend**: Express 5 API server (`artifacts/api-server`)
- **Database**: Remote MySQL at `82.165.170.203` (`materiali_db`)
- **Build**: esbuild (backend), Vite (frontend)
- **Node.js**: v24+

## What's Been Implemented
- [2026-01-28] Created comprehensive Ubuntu VPS deployment guide (`/app/DEPLOYMENT_GUIDE.md`)
  - System prerequisites (Node.js 24, pnpm, Nginx, PM2)
  - Project upload (Git or SCP)
  - Build instructions
  - PM2 process management
  - Nginx reverse proxy configuration (static files + API proxy)
  - Firewall setup (UFW)
  - Optional SSL with Let's Encrypt
  - Security improvements (env vars for MySQL creds)
  - PM2 ecosystem file
  - Troubleshooting guide

## Backlog
- P1: Move hardcoded MySQL credentials to environment variables
- P2: Add CI/CD pipeline for automated deployments
- P2: Add monitoring/alerting (e.g., PM2 monitoring, Uptime Robot)
- P3: Add Docker containerization option
