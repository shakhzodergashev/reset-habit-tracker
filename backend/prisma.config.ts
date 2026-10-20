import { defineConfig, env } from 'prisma/config';

// Prisma 7 no longer reads .env automatically.
// Node's built-in loader reads backend/.env (no dotenv package needed).
process.loadEnvFile();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
