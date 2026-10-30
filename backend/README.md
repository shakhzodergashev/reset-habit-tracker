# RESET backend

The NestJS API for RESET. For full setup instructions (database, `.env` files, migrations), see the [main README](../README.md).

## Commands

Run these inside `backend/`.

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start the API on http://localhost:3000 and restart on changes |
| `npm run build` | Compile to `dist/` |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the `reset_test` database |
| `npm run test:db:migrate` | Apply migrations to the `reset_test` database |
| `npm run lint` | ESLint and Prettier (also fixes formatting) |
| `npx prisma migrate deploy` | Apply migrations to the database in `.env` |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
| `npx prisma studio` | Browse the database in your browser |

## Settings

The API reads `backend/.env` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `PORT` | Optional, defaults to 3000 |
