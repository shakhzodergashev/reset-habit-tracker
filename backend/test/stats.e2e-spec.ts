import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { addDays, toDbDate, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createBackdatedHabit,
  createTestApp,
  markDone,
  registerUser,
} from './helpers';

interface StatsResponse {
  today: string;
  habitCount: number;
  perfectDays: number;
  activeDays: number;
  totalCompletions: number;
  bestStreak: number;
}

const TASHKENT = 'Asia/Tashkent';

describe('Stats and insights (e2e)', () => {
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

  // ---------- small helpers ----------

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const daysAgo = (n: number) => addDays(today, -n);
  const createHabit = (name: string) => createBackdatedHabit(app, token, name);
  const mark = (habitId: string, date: string) =>
    markDone(app, token, habitId, date);

  async function getStats(): Promise<StatsResponse> {
    const res = await api().get('/stats').set(auth()).expect(200);
    return res.body as StatsResponse;
  }

  // ---------- GET /stats ----------

  describe('GET /stats', () => {
    it('starts empty', async () => {
      expect(await getStats()).toEqual({
        today,
        habitCount: 0,
        perfectDays: 0,
        activeDays: 0,
        totalCompletions: 0,
        bestStreak: 0,
      });
    });

    it('counts perfect days, active days and completions', async () => {
      const habits = await Promise.all(
        ['Read', 'Run', 'Walk', 'Sleep'].map(createHabit),
      );
      // Yesterday: all 4 done (perfect). Today: 3 of 4.
      for (const id of habits) await mark(id, daysAgo(1));
      for (const id of habits.slice(0, 3)) await mark(id, today);

      expect(await getStats()).toEqual({
        today,
        habitCount: 4,
        perfectDays: 1,
        activeDays: 2,
        totalCompletions: 7,
        bestStreak: 2,
      });
    });

    it('judges each day only by the habits that existed on it', async () => {
      const read = await createHabit('Read');
      const run = await createHabit('Run');
      await mark(read, daysAgo(1));
      await mark(run, daysAgo(1)); // 2 of 2 = perfect

      // A third habit, starting today, doesn't spoil yesterday.
      await api()
        .post('/habits')
        .set(auth())
        .send({ name: 'Walk' })
        .expect(201);
      await mark(read, today);
      await mark(run, today); // 2 of 3 today = not perfect
      expect(await getStats()).toMatchObject({ perfectDays: 1, activeDays: 2 });
    });

    it('gives the best streak of any habit, ever', async () => {
      const read = await createHabit('Read');
      const run = await createHabit('Run');
      for (const n of [7, 6, 5]) await mark(read, daysAgo(n)); // 3 in a row
      await mark(run, daysAgo(1));
      await mark(run, today); // 2 in a row
      expect((await getStats()).bestStreak).toBe(3);
    });

    it('keeps an archived habit’s days, up to the day it was archived', async () => {
      const kept = await createHabit('Kept');
      const archived = await createHabit('Archived');
      await mark(archived, daysAgo(1)); // 1 of 2
      await mark(kept, today);
      await mark(archived, today); // 2 of 2 = perfect

      // Archiving takes nothing away that was already done.
      await api().post(`/habits/${archived}/archive`).set(auth()).expect(200);
      expect(await getStats()).toMatchObject({
        habitCount: 1, // only active habits
        perfectDays: 1,
        totalCompletions: 3,
      });

      // Restoring brings it back as an active habit, still with all its days.
      await api().post(`/habits/${archived}/restore`).set(auth()).expect(200);
      expect(await getStats()).toMatchObject({
        habitCount: 2,
        perfectDays: 1,
      });
    });

    it('stops counting a habit after the day it was archived', async () => {
      const kept = await createHabit('Kept');
      const old = await createHabit('Old');
      // "Old" was archived 3 days ago; since then only "Kept" counts.
      await prisma.habit.update({
        where: { id: old },
        data: {
          isArchived: true,
          pauses: { create: { archivedOn: toDbDate(daysAgo(3)) } },
        },
      });
      await mark(kept, daysAgo(1));
      await mark(kept, today);

      // Two perfect days: "Old" no longer makes them look half done.
      expect((await getStats()).perfectDays).toBe(2);
    });

    it('leaves a restored habit out of the days it was put away', async () => {
      const kept = await createHabit('Kept');
      const back = await createHabit('Back');
      // "Back" was archived 5 days ago and restored 2 days ago.
      await prisma.habitPause.create({
        data: {
          habitId: back,
          archivedOn: toDbDate(daysAgo(5)),
          restoredOn: toDbDate(daysAgo(2)),
        },
      });
      await mark(kept, daysAgo(3)); // put away that day: "Kept" alone = perfect
      await mark(kept, daysAgo(2)); // restored that day: 1 of 2

      expect((await getStats()).perfectDays).toBe(1);
    });

    it('opens a pause when archiving and closes it when restoring', async () => {
      const habit = await createHabit('Read');
      const pauses = () =>
        prisma.habitPause.findMany({ where: { habitId: habit } });

      await api().post(`/habits/${habit}/archive`).set(auth()).expect(200);
      await api().post(`/habits/${habit}/archive`).set(auth()).expect(200); // again: no 2nd pause
      expect(await pauses()).toEqual([
        expect.objectContaining({
          archivedOn: toDbDate(today),
          restoredOn: null,
        }),
      ]);

      await api().post(`/habits/${habit}/restore`).set(auth()).expect(200);
      expect(await pauses()).toEqual([
        expect.objectContaining({ restoredOn: toDbDate(today) }),
      ]);
    });

    it('requires login', async () => {
      await api().get('/stats').expect(401);
    });
  });

  // ---------- GET /insights ----------

  describe('GET /insights', () => {
    it('gives this week by default, and month or year when asked', async () => {
      const read = await createHabit('Read');
      await mark(read, today);

      const week = await api().get('/insights').set(auth()).expect(200);
      expect(week.body).toMatchObject({
        range: 'week',
        dayStreak: 1,
        topHabits: [expect.objectContaining({ name: 'Read', doneDays: 1 })],
      });
      expect((week.body as { bars: unknown[] }).bars).toHaveLength(7);

      const year = await api()
        .get('/insights?range=year')
        .set(auth())
        .expect(200);
      expect((year.body as { bars: unknown[] }).bars).toHaveLength(12);

      await api().get('/insights?range=month').set(auth()).expect(200);
      await api().get('/insights?range=decade').set(auth()).expect(400);
    });

    it('requires login', async () => {
      await api().get('/insights').expect(401);
    });
  });
});
