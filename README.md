# C2F LMS Assessment Platform (MERN)

Production-oriented full-stack MERN application for online assessments with MCQ and coding questions.

## Stack

- Frontend: React + Vite + Monaco Editor
- Backend: Node.js + Express
- Database: MongoDB Atlas (Mongoose)
- Code Execution: Judge0 API integration
- Auth: JWT (Admin/Candidate roles)

## Features Implemented

- JWT signup/login with roles (`admin`, `candidate`)
- Admin test management:
  - Create tests with mixed MCQ and coding questions
  - Duration, negative marking, randomization controls
  - Publish/unpublish tests
  - Advanced question editing (add/edit/delete questions inside a test)
  - CSV question bank import
- Candidate assessment flow:
  - Start/resume attempt with persistent attempt records
  - Timer enforcement and expiry handling
  - Autosave answers every few seconds
  - Sidebar question navigation
  - Coding editor (Monaco) with language switch (JS/Python/Java/C++)
  - Run code and submit code against Judge0
- Anti-cheating:
  - Tab switch, window blur/focus, fullscreen exit, copy/paste tracking
  - Persist logs in MongoDB
  - Auto-submit on threshold breaches
- Results and analytics:
  - Score calculation with breakdown
  - Admin analytics endpoint and dashboard cards
  - Admin activity feed (student + test + status + violations + latest proctor event)
- Student onboarding:
  - Admin registration code and link generation
  - Candidate signup under specific admin code
  - Admin-side student list for linked candidates
  - Bulk student import via CSV under admin (or selected admin by super-admin)
  - Dedicated per-student detail page with attempt timeline, cheating logs, and score trend
- Super-admin hierarchy:
  - Super-admin can create and manage multiple admins
  - Role-scoped analytics and student views across managed admins
- Pagination + filtering on tests/attempts APIs
- Security baseline:
  - Helmet, CORS, rate limiting, mongo sanitization, route protection

## Project Structure

- `backend/`
  - `src/config` env and DB setup
  - `src/models` Users, Tests, Questions, Attempts, Cheating Logs
  - `src/controllers` API handlers
  - `src/routes` `/auth`, `/tests`, `/attempts`, `/submissions`, `/analytics`
  - `src/services` Judge0 and scoring services
  - `src/middleware` auth, role, error handlers
- `frontend/`
  - `src/pages` Login, Signup, Admin Dashboard, Candidate Dashboard, Test Page
  - `src/services` API modules
  - `src/context` auth state
  - `src/components` route guard

## Environment Variables

### Backend (`backend/.env`)

Use `backend/.env.example` as template.

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `FRONTEND_URL`
- `JUDGE0_BASE_URL`
- `JUDGE0_API_KEY`
- `JUDGE0_HOST`
- `CHEATING_VIOLATION_THRESHOLD`

### Frontend (`frontend/.env`)

Use `frontend/.env.example` as template.

- `VITE_API_URL`

## Local Setup

1. Install dependencies
  - `cd backend && npm install`
  - `cd ../frontend && npm install`
2. Create env files:
   - `backend/.env`
   - `frontend/.env`
3. Start app
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && npm run dev`
4. URLs
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

## API Summary

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/admin/registration` (admin)
- `POST /api/auth/admin/registration/regenerate` (admin)
- `GET /api/auth/admin/students` (admin)
- `POST /api/auth/admin/students/import/csv` (admin/super-admin)
- `GET /api/auth/super-admin/admins` (super-admin)
- `POST /api/auth/super-admin/admins` (super-admin)

- `GET /api/tests`
- `GET /api/tests/:id`
- `POST /api/tests` (admin)
- `PATCH /api/tests/:id` (admin)
- `PATCH /api/tests/:id/publish` (admin)
- `PATCH /api/tests/:id/unpublish` (admin)
- `POST /api/tests/import/csv` (admin)
- `GET /api/tests/:id/questions` (admin)
- `POST /api/tests/:id/questions` (admin)
- `PATCH /api/tests/:id/questions/:questionId` (admin)
- `DELETE /api/tests/:id/questions/:questionId` (admin)

- `POST /api/attempts/start/:testId` (candidate)
- `GET /api/attempts`
- `GET /api/attempts/:attemptId`
- `PATCH /api/attempts/:attemptId/answers`
- `POST /api/attempts/:attemptId/logs`
- `POST /api/attempts/:attemptId/submit`

- `POST /api/submissions/run`
- `POST /api/submissions/:attemptId/:questionId`

- `GET /api/analytics/admin` (admin)
- `GET /api/analytics/admin/activity` (admin)
- `GET /api/analytics/admin/students/:studentId/detail` (admin/super-admin)

## CSV Import Format

Use admin endpoint `POST /api/tests/import/csv` with payload fields:

- `title`
- `description`
- `durationMinutes`
- `csvContent`

CSV headers expected:

- `questionTitle`
- `questionDescription`
- `optionA`
- `optionB`
- `optionC`
- `optionD`
- `correctAnswers`
- `allowMultiple`
- `marks`
- `negativeMarks`

Example `correctAnswers` values:

- Single: `B`
- Multiple: `A|C`

## Student CSV Import Format

Use endpoint `POST /api/auth/admin/students/import/csv` with payload fields:

- `csvContent`
- `adminId` (required only for super-admin context)

CSV headers expected:

- `name`
- `email`
- `password`

Sample file:

- `backend/samples/student_bulk_import_template.csv`

## Deployment

### Backend (Render / Railway / AWS)

- Deploy `backend` service
- Set environment variables from `.env.example`
- Ensure CORS `FRONTEND_URL` matches deployed frontend URL

### Frontend (Vercel / Netlify)

- Deploy `frontend`
- Set `VITE_API_URL` to deployed backend API URL

## Roadmap Enhancements

- WebSocket sync for multi-device resilience
- Better admin question builder with dedicated UI forms
- Live proctoring integrations
- Leaderboards and test cohort analytics
- Resume-with-reconnect controls and lock-step proctor mode
