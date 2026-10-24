// Runs before every e2e test file.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// 1. Load the test settings and force them to win.
//    (process.loadEnvFile() does not work here: Jest gives each test file
//    its own copy of process.env, which loadEnvFile cannot see.)
Object.assign(process.env, parseEnv(readFileSync('.env.test', 'utf8')));

// 2. Safety lock: e2e tests delete data, so never let them touch another database.
if (!process.env.DATABASE_URL?.includes('/reset_test')) {
  throw new Error(
    'E2E tests must use the reset_test database. Check backend/.env.test.',
  );
}
