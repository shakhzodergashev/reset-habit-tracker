# RESET

**Build better days. One habit at a time.**

RESET is a daily habit tracker. Users create habits, mark them complete for each calendar day, and see their current streak.

> **Status:** early setup (Milestone 0). Both apps are freshly scaffolded starter templates. No RESET features exist yet.

## MVP scope (planned)

- Email and password registration and login (bcrypt + JWT), with server-side logout via database sessions
- Create, edit, archive, and restore habits (name, optional description, color)
- At most one completion per habit per calendar date, including past dates
- Current streak per habit, calculated in the user's own time zone
- Dashboard of today's active habits, with incomplete habits listed first

## Tech stack

| Area     | Technology                         | Status             |
| -------- | ---------------------------------- | ------------------ |
| Backend  | NestJS 11, TypeScript              | Scaffolded         |
| Frontend | React 19, TypeScript, Vite         | Scaffolded         |
| Database | PostgreSQL                         | Planned, not connected |
| ORM      | Prisma                             | Planned, not installed |

## Repository structure

```
reset-habit-tracker/
├─ backend/     NestJS API (starter template)
├─ frontend/    React + Vite app (starter template)
├─ .gitignore
└─ README.md
```

The two apps are independent. Each has its own `package.json` and `node_modules`.

## Prerequisites

- Node.js 20.19+ or 22.12+ (developed on Node 24.19)
- npm (developed on npm 11.17)

## Getting started

Install dependencies for each app:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Backend

From `backend/`:

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run start`     | Start the API at http://localhost:3000               |
| `npm run start:dev` | Start the API and restart automatically on changes   |
| `npm run build`     | Compile to `backend/dist/`                           |

The port can be changed with the `PORT` environment variable. Right now the only route is `GET /`, which returns `Hello World!`.

### Frontend

From `frontend/`:

| Command         | What it does                                                   |
| --------------- | -------------------------------------------------------------- |
| `npm run dev`   | Start the Vite dev server (it prints the local URL)             |
| `npm run build` | Type-check and build to `frontend/dist/`                       |

## Currently working vs. planned

**Working now**
- The backend builds and serves the starter `GET /` route
- The frontend production build succeeds

**Not implemented yet**
- Database, Prisma schema, and migrations
- Authentication and sessions
- Habits, completions, streaks, and the dashboard
- Environment configuration (`.env.example` will be added with the database setup)
