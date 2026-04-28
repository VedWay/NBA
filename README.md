# NBA - Faculty & Student Achievement Management System

**NBA** is a full-stack web application for managing faculty profiles, publications, projects, achievements, and student-related records. It provides admin workflows, import/export utilities, notifications, and a realtime dashboard to keep academic records consistent and actionable.

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [User Workflows](#user-workflows)
- [Backend Routes & Endpoints](#backend-routes--endpoints)
- [Database Schema](#database-schema)
- [Services Layer](#services-layer)
- [Real-Time & Notifications](#real-time--notifications)
- [Setup & Deployment](#setup--deployment)
- [API Reference](#api-reference)
- [Key Features](#key-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## System Overview

NBA centralizes academic and research records for a department or institution. The system stores faculty profiles, publications, patents, projects, qualifications, and student achievements. Admins can import bulk data, review and approve entries, export reports, and manage notifications.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React (Vite), Tailwind CSS |
| **Backend** | Node.js, Express |
| **Database** | Supabase (PostgreSQL) / SQL schema files included |
| **Real-time** | WebSocket hub (custom) |
| **Storage** | Local `uploads/` + Supabase Storage / Firebase utilities present |
| **Exports** | CSV / SQL seed files |

---

## Architecture

 - Frontend (Vite + React) communicates with backend via REST API and WebSocket for realtime updates.
 - Backend exposes modular routes (auth, faculty, achievements, publications, projects, notifications, reports) and uses a services layer to interact with the database and storage.
 - Storage for uploaded assets is available under `uploads/` and backend integrates with Supabase and Firebase helper utilities in `backend/src/utils`.

System components:

```
Frontend (React / Vite) <--> Backend (Express) <--> Supabase (Postgres & Storage)
                          \-> WebSocket hub for realtime
                          \-> Firebase helper for notifications
```

---

## User Workflows

### Admin

- Authenticate via `/api/auth` endpoints
- Import bulk faculty, publications or inventory via CSV/SQL seeds
- Review and approve submitted achievements or publications
- Export reports (CSV/SQL) and run ad-hoc queries using provided SQL files in `database/` and `mysql/`

### Faculty / Student

- Sign in and update personal profile
- Submit achievements or publications (subject to admin review)
- View their history and exported reports

---

## Backend Routes & Endpoints

Routes are implemented under `backend/src/routes` and controllers under `backend/src/controllers`.

Common route groups (examples):

- `POST /api/auth/signup` — create user
- `POST /api/auth/login` — login and receive JWT
- `GET /api/faculty` — list faculty profiles
- `POST /api/faculty` — create or import faculty record (admin)
- `GET /api/achievements` — list achievements
- `POST /api/achievements` — create achievement (student/admin)
- `GET /api/publications` — list publications
- `POST /api/publications` — create publication record
- `GET /api/notifications` — fetch notifications for user
- `GET /api/reports/export` — export data (CSV/SQL)

Refer to `backend/src/routes` for the full route map and `backend/src/controllers` for implementation specifics.

---

## Database Schema

SQL schema and seed files live under `database/` and `mysql/` directories. Primary tables include users, faculty, publications, projects, achievements, and history/audit tables. UUIDs or auto-incrementing keys are used depending on the SQL dialect in the folder.

Key files:

- `database/schema.sql`
- `database/seed.sql`
- `mysql/schema.sql` and `mysql/seed.sql`

Use the included migration files (see `database/migrations/`) to apply schema changes.

---

## Services Layer

Services are under `backend/src/db` and `backend/src/utils` and provide abstractions for:

- Database access (Supabase helper in `backend/src/db/supabase.js`)
- Firebase utilities (notifications) in `backend/src/utils/firebase.js`
- Export and import helpers used by admin routes

These provide single places to update credentials and runtime behavior.

---

## Real-Time & Notifications

 - A WebSocket hub exists at `backend/src/realtime/wsHub.js` for realtime admin notifications and dashboard updates.
 - Firebase helper functions are available for push notifications or messaging if configured.

Clients should connect using the JWT for authenticated realtime channels; the backend sets up user/role rooms for targeted events.

---

## Setup & Deployment

Environment variables (example for `backend/.env`):

```
PORT=4000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_min_32_chars
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_BUCKET=uploads
FIREBASE_CONFIG_JSON={...}
```

Frontend environment (example `frontend/.env`):

```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Local development:

```bash
# from repo root
# install dependencies for frontend and backend
cd backend && npm install
cd ../frontend && npm install

# start backend
cd ../backend && npm run dev

# start frontend
cd ../frontend && npm run dev
```

Make sure to run SQL migrations / import seed data from `database/` or `mysql/` as applicable.

---

## API Reference

High-level endpoints (implementation in `backend/src/routes`):

- `POST /api/auth/signup` — public
- `POST /api/auth/login` — public
- `GET /api/faculty` — authenticated
- `POST /api/faculty/import` — admin, multipart CSV/Excel import
- `GET /api/achievements` — authenticated
- `POST /api/achievements` — authenticated
- `GET /api/notifications` — authenticated
- `GET /api/admin/export` — admin

Refer to route files for specific request/response shapes and required permissions.

---

## Key Features

- Centralized faculty profiles and CV data
- Publications, patents, projects and achievement tracking
- Bulk import and seed scripts for quick onboarding
- CSV/SQL export for reporting and audits
- Realtime notification hub for admin events
- Role-based access control (student/admin)

---

## Troubleshooting

- If frontend cannot reach backend, confirm `VITE_API_URL` and `FRONTEND_URL` match actual ports.
- If JWT issues occur, ensure `JWT_SECRET` is set and consistent across backend instances.
- If realtime events don't appear, check `backend/src/realtime/wsHub.js` initialization and WebSocket connections in browser DevTools.

---

## Contributing

1. Create a branch from `main`.
2. Add routes/controllers under `backend/src/routes` and `backend/src/controllers` following existing patterns.
3. Update SQL schema or add migration in `database/migrations/`.
4. Add frontend UI in `frontend/src/pages` or `frontend/src/components` and update API client in `frontend/src/api`.
5. Open a PR with a clear description and link to any DB changes.

---

**Created**: April 2026
**Status**: Active Development