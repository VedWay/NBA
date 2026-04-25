# NBA Accreditation: Faculty Information and Student Achievements System

A comprehensive full-stack portal for managing NBA accreditation data (Faculty) and tracking excellence (Student Achievements). Features include role-based access, dual-database integration, and a unified admin approval workflow.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router, TanStack Query, Zod
- **Backend**: Node.js, Express.js, MySQL, Firebase Admin SDK, Zod
- **Reporting**: Excel export via xlsx

## Workspace Structure

- `frontend/`: React application for both Faculty and Student portals.
- `backend/`: Express API server managing dual-database logic.
- `database/schema.sql`: MySQL schema for Faculty Information (NBA).
- `database/student_schema.sql`: MySQL schema for Student Achievements (vjtiachievements).

## Quick Start

### 1) MySQL setup

1. Create two databases: `nba` and `vjtiachievements`.
2. Run SQL in this order:
   - `database/schema.sql` (for Faculty Information)
   - `database/student_schema.sql` (for Student Achievements)
3. Seed the lookup tables (departments, years, categories) for the student database.

### 2) Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill keys:
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`
   - `MYSQL_DATABASE` (set to `nba` for Faculty data)
   - `STUDENT_DB_NAME` (set to `vjtiachievements` for Student data)
   - `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
   - `JWT_SECRET`
3. Install and run:
   - `npm install`
   - `npm run dev`

### 3) Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set `VITE_API_BASE_URL` to backend URL (default `http://localhost:4000`).
3. Install and run:
   - `npm install`
   - `npm run dev`

## API Endpoints

### Auth
- `POST /auth/login` (Firebase + JWT for both Faculty and Admin)

### Faculty Information System
- `GET /faculty`, `POST /faculty`, `PUT /faculty/:id`
- `GET /publications/:faculty_id`, `GET /fdp/:faculty_id`, `GET /projects/:faculty_id`

### Student Achievements Portal
- `GET /student/achievements` (Approved entries for the Hall of Excellence)
- `POST /student/submit` (Achievement submission with file proof)
- `GET /student/filters` (Dynamic categories/departments)

### Admin (Unified Request Center)
- **Faculty Section**: `GET /admin/pending`, `PUT /admin/approve/:table/:id`
- **Student Section**: `GET /student/admin/achievements`, `PUT /student/admin/approve/:id`
- **Redo Logic**: `PUT /student/admin/redo/:id` (Move student/faculty entries back to pending)

## Notes

- **Dual-Tab Admin**: The Admin Center toggles between Faculty Information requests and Student Achievement submissions.
- **Redo Action**: Admins can reverse approval/rejection decisions for both portals to fix errors.
- **Navbar Labels**: Updated "Student Desk" to "Submit Achievement" to differentiate from the Faculty portal.
- **File Proofs**: All achievement and qualification proofs are served as secure static files from the backend.

## JWT, Firebase, and Storage

- **Auth**: Uses Firebase for identity and custom JWT for role-based authorization across both systems.
- **Storage**: Faculty photos and Student achievement proofs persist via structured backend storage paths.
- **Toasts**: Consistent Maroon/Gold themed notifications for all Faculty and Student record updates.
