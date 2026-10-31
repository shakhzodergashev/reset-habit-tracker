import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { addDays, toDbDate, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser } from './helpers';

const TASHKENT = 'Asia/Tashkent';

describe('Stats (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let today: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    token = await registerUser(app, 'ali@example.com', TASHKENT);
    today = todayInTimeZone(TASHKENT);
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const authed = () => ({ Authorization: `Bearer ${token}` });

  /** Creates a habit that "started" 10 days ago, so past days can be marked. */
  async function createHabit(name: string): Promise<string> {
    const res = await api()
      .post('/habits')
      .set(authed())
      .send({ name })
      .expect(201);
    const habit = res.body as { id: string; startDate: string };
    await prisma.habit.update({
      where: { id: habit.id },
      data: { startDate: toDbDate(addDays(habit.startDate, -10)) },
    });
    return habit.id;
  }

  async function mark(habitId: string, date: string) {
    await api()
      .put(`/habits/${habitId}/completions/${date}`)
      .set(authed())
      .expect(200);
  }

  async function getStats() {
    const res = await api().get('/stats').set(authed()).expect(200);
    return res.body as Record<string, unknown>;
  }

  it('starts empty, on a 365-day hill', async () => {
    expect(await getStats()).toEqual({
      today,
      yearDays: 365,
      habitCount: 0,
      journeyDays: 0,
      perfectDays: 0,
      activeDays: 0,
      totalCompletions: 0,
    });
  });

  it('counts the journey, perfect days and completions', async () => {
    const habits = await Promise.all(
      ['Read', 'Run', 'Walk', 'Sleep'].map(createHabit),
    );
    // Yesterday: all 4 done. Today: 3 of 4.
    for (const id of habits) await mark(id, addDays(today, -1));
    for (const id of habits.slice(0, 3)) await mark(id, today);

    expect(await getStats()).toMatchObject({
      habitCount: 4,
      journeyDays: 1.75,
      perfectDays: 1,
      activeDays: 2,
      totalCompletions: 7,
    });
  });

  it('leaves archived habits out', async () => {
    const kept = await createHabit('Kept');
    const archived = await createHabit('Archived');
    await mark(kept, today);
    await mark(archived, today);
    await api().post(`/habits/${archived}/archive`).set(authed()).expect(200);

    // Only "Kept" is left, and it was done: a full day.
    expect(await getStats()).toMatchObject({
      habitCount: 1,
      journeyDays: 1,
      perfectDays: 1,
    });
  });

  it('requires login', async () => {
    await api().get('/stats').expect(401);
  });
});
