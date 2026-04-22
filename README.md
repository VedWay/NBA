# NBA Accreditation Faculty Information System

Full-stack portal for NBA accreditation data management with role-based access and admin approval workflow.

## Tech  Stack

- Frontend: React (Vite), Tailwind CSS, React Router, React Hook Form, TanStack Query, Zod
- Backend: Node.js, Express.js, MySQL, Zod
- Reporting: Excel export via xlsx

## Workspace Structure

- frontend: React application
- backend: Express API server
- database/schema.sql: MySQL schema
- database/seed.sql: Seed sample data

## Quick Start

### 1) MySQL setup

1. Create a MySQL database (for example `nba`).
2. Run SQL in this order:
   - database/schema.sql
   - database/seed.sql
3. Optional: import data snapshot files from `database/*_rows.sql`.

### 2) Backend

1. Copy backend/.env.example to backend/.env.
2. Fill keys:
   - MYSQL_HOST
   - MYSQL_PORT
   - MYSQL_USER
   - MYSQL_PASSWORD
   - MYSQL_DATABASE
   - JWT_SECRET
   - ADMIN_SIGNUP_CODE (optional)
3. Install and run:
   - npm install
   - npm run dev

### 3) Frontend

1. Copy frontend/.env.example to frontend/.env.
2. Set VITE_API_BASE_URL to backend URL (default http://localhost:4000).
3. Install and run:
   - npm install
   - npm run dev

## API Endpoints

### Auth

- POST /auth/login

### Faculty

- GET /faculty
- GET /faculty/:id
- POST /faculty
- PUT /faculty/:id

### Publications

- GET /publications/:faculty_id
- POST /publications
- PUT /publications/:id
- DELETE /publications/:id

### FDP

- GET /fdp/:faculty_id
- POST /fdp
- PUT /fdp/:id

### Projects

- GET /projects/:faculty_id
- POST /projects
- PUT /projects/:id

### Admin

- GET /admin/pending
- PUT /admin/approve/:table/:id
- DELETE /admin/reject/:table/:id

### Reports

- GET /reports/faculty/:id
- GET /reports/export/faculty/:id

## Notes

- Only approved faculty records are visible publicly.
- Faculty edits are marked pending unless submitted by admin.
- Audit history is recorded in audit_log.
- CV auto-generation is available in the dashboard as downloadable text format.

## JWT and Buckets

- Backend now issues and validates its own JWT for API auth/roles using JWT_SECRET.
- Faculty photo uploads now persist directly in `faculty.photo_url`.
