# PES LMS Assessment Platform (MERN)

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

- `GET /api/tests`
- `GET /api/tests/:id`
- `POST /api/tests` (admin)
- `PATCH /api/tests/:id` (admin)
- `PATCH /api/tests/:id/publish` (admin)
- `PATCH /api/tests/:id/unpublish` (admin)
- `POST /api/tests/import/csv` (admin)

- `POST /api/attempts/start/:testId` (candidate)
- `GET /api/attempts`
- `GET /api/attempts/:attemptId`
- `PATCH /api/attempts/:attemptId/answers`
- `POST /api/attempts/:attemptId/logs`
- `POST /api/attempts/:attemptId/submit`

- `POST /api/submissions/run`
- `POST /api/submissions/:attemptId/:questionId`

- `GET /api/analytics/admin` (admin)

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
