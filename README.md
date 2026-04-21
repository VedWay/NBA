# NBA Accreditation Faculty Information System

Full-stack portal for NBA accreditation data management with role-based access and admin approval workflow.

## Tech  Stack

- Frontend: React (Vite), Tailwind CSS, React Router, React Hook Form, TanStack Query, Zod
- Backend: Node.js, Express.js, Supabase (PostgreSQL/Auth/Storage), Zod
- Reporting: Excel export via xlsx

## Workspace Structure

- frontend: React application
- backend: Express API server
- supabase/schema.sql: Database schema and audit triggers
- supabase/seed.sql: Seed sample data

## Quick Start

### 1) Supabase setup

1. Create a Supabase project.
2. Run SQL in this order:
   - supabase/schema.sql
   - supabase/seed.sql
3. Create auth users in Supabase Auth and update auth_user_id values in seed.sql (or insert your own users in public.users).

### 2) Backend

1. Copy backend/.env.example to backend/.env.
2. Fill keys:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. Install and run:
   - npm install
   - npm run dev

### 3) Frontend

1. Copy frontend/.env.example to frontend/.env.
2. Set VITE_API_BASE_URL to backend URL (default http://localhost:5000).
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
- Audit history is recorded in public.audit_log.
- CV auto-generation is available in the dashboard as downloadable text format.

## JWT and Buckets

- JWT secret is managed by Supabase in project settings and is not stored in this repo.
- Backend now issues and validates its own JWT for API auth/roles using JWT_SECRET.
- In publishable-key mode, SUPABASE_ANON_KEY is enough to run the API after applying schema.sql policies.
- SUPABASE_SERVICE_ROLE_KEY remains optional and can be used later for stricter admin operations.
- Storage buckets are defined in supabase/schema.sql:
   - faculty-photos (public)
   - faculty-cv (private)
- Bucket env placeholders are available in backend/.env.example and frontend/.env.example.
