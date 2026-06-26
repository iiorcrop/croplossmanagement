# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ICAR-IIOR CropLoss Management Portal — full-stack MERN app for recording, reviewing, and reporting crop disease/pest observations across India for oilseed crops (castor, sunflower, safflower, sesame, niger, linseed).

## Commands

Run from repo root unless noted.

- `npm run install-all` — install root + backend + frontend deps
- `npm run dev` — start backend (nodemon, port 5000) and frontend (CRA, port 3000) concurrently
- `npm run build` — production build of the React frontend
- `cd backend && npm run seed` — run `backend/seed.js` (one-off data seeding)
- `cd backend && node seed_msp.js` — MSP seeding
- `cd frontend && npm test -- --testPathPattern=<file>` — run a single CRA test file

Docker (production-style): `docker-compose up --build` — backend on `7070`, frontend on `7001`, nginx reverse proxy on `7000`. Backend reads `./backend/.env`.

Note: `server.js` also auto-seeds initial users on first boot when no `super_admin` exists. Default login is printed in the boot banner (`admin@icar.gov.in / Admin@2025`).

## Architecture

### Backend (`backend/`, Node + Express + Mongoose)

- `server.js` — single entry point. Mounts all routes under `/api/*`, applies helmet/CORS/morgan/rate-limit (stricter on `/api/auth/login`), connects to Mongo via `config/db.js`, then runs `seedInitialData()` before listening. Health check at `GET /api/health`.
- `routes/` — one router per resource: `auth`, `users`, `entries`, `personalEntries`, `locations`, `settings`, `masterData`, `report`. Routes assemble validation + auth middleware around Mongoose calls.
- `middleware/auth.js` — exports `protect` (JWT verify → `req.user`), `authorize(...roles)` (RBAC), `cropAccess` (checks `req.params.crop`/body/query against `user.assignedCrops ∪ user.reviewCrops`; super_admin bypasses), and a global `errorHandler` (translates Mongoose ValidationError/CastError/duplicate-key into JSON 400s).
- `config/constants.js` — **canonical source of crop domain knowledge**: `CROPS`, `ROLES`, `DISCIPLINES`, `SEASONS`, soil/sowing/stage/percent enums, per-crop `VARIETIES`, and `RAW_COLUMNS` (the disease + insect column schema per crop driving the entry form layout). Many routes and the frontend `EntryForm` depend on the shape here.
- `models/` — `User`, `CropEntry` (the main observation document; one entry has many `observations[]`, each a per-village row with both fixed disease/insect fields and discipline-specific arrays like `defoliators`, `capsuleSpikeBorers`, `suckingPests`, `sunflowerPests`), `MasterData` (single configurable doc holding editable dropdown lists used in the UI — varieties, centers, states, pests, etc.; mostly `Mixed`/`strict:false` for flexibility), `PersonalEntry` (`strict:false` — accepts arbitrary payloads from the standalone "Personal" tab), `PersonalParam`, `Settings`, `FinalReport`.

### Frontend (`frontend/`, CRA + React 18 + react-router 6)

- `src/App.js` — all routes, wrapped in `ProtectedRoute`/`PublicRoute` from `context/AuthContext`. Role gates are enforced in two places: the `roles={[...]}` prop on `ProtectedRoute` AND server-side via `authorize`/`cropAccess`. Keep both in sync when adding routes.
- `context/AuthContext.js` — owns auth state, login/logout, and user hydration.
- `utils/api.js` — axios instance; baseURL is `process.env.REACT_APP_API_URL || '/api'` (so Docker/nginx and CRA dev proxy both work).
- `pages/` — one component per route. The heavy ones: `EntryForm` (dynamic columns driven by crop+discipline from `RAW_COLUMNS`), `EntriesList` (used in three modes: `mine`, `review`, `all` based on role), `MasterData` (admin CRUD over the `MasterData` doc, keyed by `/master/:type`), `FormMatrix`/`SuperAdminReport`/`Reports` (aggregations and exports — uses `xlsx`, `jspdf`, `jspdf-autotable`).
- `components/` — `castor/` and `sunflower/` hold crop-specific entry sub-forms; `layout/AppLayout` wraps protected pages with `Sidebar`.

### Roles & access model

Three roles drive every authorization check:
- `super_admin` — full access (skips `cropAccess`); only role with `/users`, `/master/:type`, `/settings`, `/form-matrix`.
- `crop_head` — reviews entries for crops in `reviewCrops`; sees `/review-queue`, `/all-entries`, `/reports`.
- `center_user` — creates/edits entries for their assigned center and crops in `assignedCrops`; sees `/entry/new`, `/my-submissions`.

When adding a feature touching entries, decide which role(s) and which crop list (`assignedCrops` vs `reviewCrops`) gates it, and apply both the route guard (`ProtectedRoute roles=`) and the API middleware (`protect` + `authorize` + `cropAccess`).

### Adding a new crop or column

Most form/column logic is data-driven from `backend/config/constants.js` (`CROPS`, `VARIETIES`, `RAW_COLUMNS`). Adding columns usually means editing `RAW_COLUMNS` and ensuring the corresponding field exists (or is allowed by Mixed type) on the observation schema in `models/CropEntry.js`. The frontend `EntryForm` renders columns based on this same shape fetched/derived on the client side.
