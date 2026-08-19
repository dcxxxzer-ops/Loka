# Bet Analyzer - Backend

Backend pour l'analyse de matchs en temps réel (foot et tennis).

## Installation
1. `npm install`
2. Copiez `.env.example` en `.env` et ajoutez vos clés API
3. `npm start`

## Endpoints
- `GET /api/matches/football?league=39&date=2026-08-19`
- `GET /api/matches/tennis`
- `GET /api/matches/search?query=PSG`
- `POST /api/matches/:id/live-update`
