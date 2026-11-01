import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { addDays, toDbDate } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';

/** Starts the full app with the same settings as the real server. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

/** Registers a user and returns their login token. */
export async function registerUser(
  app: INestApplication<App>,
  email: string,
  timeZone = 'Asia/Tashkent',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'password123', timeZone })
    .expect(201);
  return (res.body as { accessToken: string }).accessToken;
}

/** Creates a habit that "started" 10 days ago, so past days can be marked. */
export async function createBackdatedHabit(
  app: INestApplication<App>,
  token: string,
  name: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/habits')
    .set({ Authorization: `Bearer ${token}` })
    .send({ name })
    .expect(201);
  const habit = res.body as { id: string; startDate: string };

  await app.get(PrismaService).habit.update({
    where: { id: habit.id },
    data: { startDate: toDbDate(addDays(habit.startDate, -10)) },
  });
  return habit.id;
}

/** Marks a habit done on a day ("YYYY-MM-DD"). */
export async function markDone(
  app: INestApplication<App>,
  token: string,
  habitId: string,
  date: string,
) {
  await request(app.getHttpServer())
    .put(`/habits/${habitId}/completions/${date}`)
    .set({ Authorization: `Bearer ${token}` })
    .expect(200);
}
