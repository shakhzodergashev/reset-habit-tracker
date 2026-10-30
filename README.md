# RESET

**Build better days. One habit at a time.**

RESET is a daily habit tracker. You create habits, tick them off each day, and keep your current streak going. Every date is worked out in your own time zone, so a habit done at 1 a.m. counts for the right day.

## Features

- **Accounts:** register, log in, log out. Passwords are stored as bcrypt hashes, and logging out really ends the session on the server.
- **Habits:** create, edit and archive habits with a name, an optional description and a color. Renaming or archiving keeps the full history, and archived habits can be restored.
- **Completions:** tap a habit to mark it done for today, or fill in a forgotten day from the last 14 days. Each habit can be done at most once per day, never in the future, and never before it was created.
- **Streaks:** each habit shows its current streak. A day that isn't done *yet* doesn't break the streak until it ends, and fixing a past day updates the streak straight away.
- **Dashboard:** today's date, "3 / 5 completed", and your active habits with unfinished ones first. Works on phones and desktops.

## Tech stack

| Part | Technology |
| --- | --- |
| Backend | NestJS 11, TypeScript, class-validator, bcrypt, JWT |
| Database | PostgreSQL (developed on 18) with Prisma 7.10.1 |
| Frontend | React 19, TypeScript, Vite 8, React Router 8, plain CSS |
| Tests | Jest and Supertest (unit and end-to-end) |

## Prerequisites

- **Node.js 22.22 or newer** (developed on 24.19) and npm
- **PostgreSQL** running locally on port 5432

## Setup

Backend commands run inside `backend/`, frontend commands inside `frontend/`.

### 1. Create the database user and databases

Connect to PostgreSQL as an admin (on Windows, `psql` lives in `C:\Program Files\PostgreSQL\<version>\bin`):

```bash
psql -U postgres -h localhost
```

Then create a dedicated user and two databases, one for development and one that the automated tests are allowed to wipe:

```sql
CREATE ROLE reset_app WITH LOGIN CREATEDB;
\password reset_app
CREATE DATABASE reset_dev OWNER reset_app;
CREATE DATABASE reset_test OWNER reset_app;
\q
```

`\password` asks for the password without saving it in your shell history. `CREATEDB` is needed because Prisma creates a temporary "shadow" database while checking migrations.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create the two settings files from the template:

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
cp .env.example .env.test     # PowerShell: Copy-Item .env.example .env.test
```

In **both** files, replace `CHANGE_ME` in `DATABASE_URL` with the `reset_app` password, and set `JWT_SECRET` to a long random string. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

In **`.env.test` only**, change the database name at the end of `DATABASE_URL` from `reset_dev` to `reset_test`. The test setup refuses to run against any other database.

Both files are ignored by Git. Never commit them.

### 3. Create the tables and the Prisma client

Still in `backend/`:

```bash
npx prisma migrate deploy     # create the tables in reset_dev
npm run test:db:migrate       # create the same tables in reset_test
npx prisma generate           # generate the TypeScript database client
```

### 4. Install the frontend

```bash
cd ../frontend
npm install
```

## Running the app

Use two terminals.

```bash
# Terminal 1
cd backend
npm run start:dev             # API on http://localhost:3000
```

```bash
# Terminal 2
cd frontend
npm run dev                   # app on http://localhost:5173
```

Open **http://localhost:5173** and create an account. In development, Vite forwards every request starting with `/api` to the backend (see `frontend/vite.config.ts`), so no CORS setup is needed.

## Testing and checks

```bash
cd backend
npm test                      # unit tests (dates, streaks)
npm run test:e2e              # end-to-end tests against reset_test
npm run lint                  # ESLint + Prettier (fixes formatting)
npm run build
```

```bash
cd frontend
npm run lint                  # Oxlint
npm run build                 # type-check and production build
```

The end-to-end tests empty the `reset_test` database before each test. A safety check in `backend/test/setup-env.ts` stops them if `.env.test` points anywhere else.

## Project structure

```
reset-habit-tracker/
├─ backend/
│  ├─ prisma/          schema.prisma and migrations
│  ├─ src/
│  │  ├─ auth/         register, login, logout, AuthGuard
│  │  ├─ users/        GET /me, PATCH /me
│  │  ├─ habits/       habits, archive/restore, streak calculator
│  │  ├─ completions/  mark, undo and list completed days
│  │  ├─ dashboard/    GET /dashboard
│  │  ├─ common/dates/ time-zone-safe date helpers
│  │  └─ prisma/       database connection
│  └─ test/            end-to-end tests
└─ frontend/
   └─ src/
      ├─ api/          fetch client and one file per backend area
      ├─ auth/         login state (context), route guard
      ├─ components/   habit card, forms, 14-day grid
      ├─ pages/        dashboard, login/register, new/edit/archived habits
      └─ utils/        date formatting
```

## API

All routes except register and login need an `Authorization: Bearer <token>` header. Calendar dates are always `YYYY-MM-DD`.

| Method and path | Purpose |
| --- | --- |
| `POST /auth/register` | Create an account and log in |
| `POST /auth/login` | Log in, returns `{ accessToken, user }` |
| `POST /auth/logout` | End the current session |
| `GET /me`, `PATCH /me` | Your profile; change your time zone |
| `GET /habits?archived=true\|false` | Your active or archived habits |
| `POST /habits` | Create a habit |
| `GET /habits/:id`, `PATCH /habits/:id` | View or edit a habit |
| `POST /habits/:id/archive`, `POST /habits/:id/restore` | Archive or restore a habit |
| `GET /habits/:id/completions?from=&to=` | The days a habit was done |
| `PUT /habits/:id/completions/:date` | Mark a day done (safe to repeat) |
| `DELETE /habits/:id/completions/:date` | Undo a day (safe to repeat) |
| `GET /dashboard` | Today's date, progress and habits |

## Design decisions

- **Dates are calendar dates.** Completions are stored as PostgreSQL `DATE` values and sent as `YYYY-MM-DD` text. "Today" is always worked out in the user's saved IANA time zone, which the browser detects at registration.
- **Streaks are calculated, not stored.** They are computed on every request from the completed days, so there is no midnight job and editing the past fixes them immediately.
- **Logout is real.** Each login creates a database session that the JWT points to. Logging out marks that session as ended, and the guard refuses its token from then on.
- **Privacy by default.** Every query is scoped to the logged-in user. Someone else's habit gets the same `404` as one that doesn't exist.
- **The database enforces the key rule.** A unique constraint on `(habitId, date)` guarantees at most one completion per habit per day.

## Not included yet

- Password recovery and account deletion (out of scope for the MVP)
- Login rate limiting
- Production deployment: the `/api` proxy is a development setup only
