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

interface ClimbResponse {
  goalDays: number;
  startDate: string;
  journeyDays: number;
  isComplete: boolean;
}

interface StatsResponse {
  today: string;
  habitCount: number;
  journeyDays: number;
  perfectDays: number;
  activeDays: number;
  totalCompletions: number;
  climb: ClimbResponse | null;
  climbsCompleted: number;
}

const TASHKENT = 'Asia/Tashkent';

describe('Stats and climbs (e2e)', () => {
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
    // Pretend the account is 10 days old, like the backdated habits below.
    await prisma.user.updateMany({
      data: { createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    });
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

  async function startClimb(goalDays: number, status = 201) {
    const res = await api()
      .post('/climbs')
      .set(auth())
      .send({ goalDays })
      .expect(status);
    return res.body as StatsResponse;
  }

  /** Marks `habitId` done on each of the last `days` days (today included), straight in the database. */
  async function fillDays(habitId: string, days: number) {
    await prisma.habitCompletion.createMany({
      data: Array.from({ length: days }, (_, i) => ({
        habitId,
        date: toDbDate(daysAgo(i)),
      })),
      skipDuplicates: true,
    });
  }

  // ---------- GET /stats ----------

  describe('GET /stats', () => {
    it('starts empty, with no climb chosen yet', async () => {
      expect(await getStats()).toEqual({
        today,
        habitCount: 0,
        journeyDays: 0,
        perfectDays: 0,
        activeDays: 0,
        totalCompletions: 0,
        climb: null,
        climbsCompleted: 0,
      });
    });

    it('counts the journey, perfect days and completions', async () => {
      const habits = await Promise.all(
        ['Read', 'Run', 'Walk', 'Sleep'].map(createHabit),
      );
      // Yesterday: all 4 done. Today: 3 of 4.
      for (const id of habits) await mark(id, daysAgo(1));
      for (const id of habits.slice(0, 3)) await mark(id, today);

      expect(await getStats()).toMatchObject({
        habitCount: 4,
        journeyDays: 1.75,
        perfectDays: 1,
        activeDays: 2,
        totalCompletions: 7,
      });
    });

    it('shares each day only between the habits that existed on it', async () => {
      const read = await createHabit('Read');
      const run = await createHabit('Run');
      await mark(read, daysAgo(5)); // 1 of 2 habits = half a day
      await mark(read, daysAgo(4));
      await mark(run, daysAgo(4)); // 2 of 2 = a full day
      // days 3, 2 and 1 missed: the journey pauses, it does not go down
      expect((await getStats()).journeyDays).toBe(1.5);

      // A third habit, starting today: from today on, each habit is a third of a day.
      await api()
        .post('/habits')
        .set(auth())
        .send({ name: 'Walk' })
        .expect(201);
      await mark(run, today);
      expect((await getStats()).journeyDays).toBe(1.83);
    });

    it('keeps an archived habit’s days, up to the day it was archived', async () => {
      const kept = await createHabit('Kept');
      const archived = await createHabit('Archived');
      await mark(archived, daysAgo(1)); // 1 of 2 = half a day
      await mark(kept, today);
      await mark(archived, today); // 2 of 2 = a full day
      const before = await getStats();
      expect(before).toMatchObject({ journeyDays: 1.5, totalCompletions: 3 });

      // Archiving takes nothing away that was already done.
      await api().post(`/habits/${archived}/archive`).set(auth()).expect(200);
      expect(await getStats()).toMatchObject({
        habitCount: 1, // only active habits
        journeyDays: 1.5,
        perfectDays: 1,
        totalCompletions: 3,
      });

      // Restoring brings it back as an active habit, still with all its days.
      await api().post(`/habits/${archived}/restore`).set(auth()).expect(200);
      expect(await getStats()).toMatchObject({
        habitCount: 2,
        journeyDays: 1.5,
      });
    });

    it('stops sharing days with a habit after the day it was archived', async () => {
      const kept = await createHabit('Kept');
      const old = await createHabit('Old');
      // "Old" was archived 3 days ago; since then only "Kept" shares each day.
      await prisma.habit.update({
        where: { id: old },
        data: {
          isArchived: true,
          pauses: { create: { archivedOn: toDbDate(daysAgo(3)) } },
        },
      });
      await mark(kept, daysAgo(1));
      await mark(kept, today);

      // Two full days: "Old" no longer makes them look half done.
      expect(await getStats()).toMatchObject({
        journeyDays: 2,
        perfectDays: 2,
      });
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
      await mark(kept, daysAgo(3)); // put away that day: "Kept" alone = a full day
      await mark(kept, daysAgo(2)); // restored that day: 1 of 2 = half a day

      expect((await getStats()).journeyDays).toBe(1.5);
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

  // ---------- climbs ----------

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

  describe('POST /climbs and PATCH /climbs/current', () => {
    it('starts the first climb on the day the account was made, so earlier days count', async () => {
      const read = await createHabit('Read');
      await mark(read, daysAgo(3));
      await mark(read, today);

      const stats = await startClimb(66);
      expect(stats.climb).toEqual({
        goalDays: 66,
        startDate: daysAgo(10),
        journeyDays: 2,
        isComplete: false,
      });
      expect(stats.climbsCompleted).toBe(0);
    });

    it('only accepts 30, 66, 100 or 365 days', async () => {
      for (const goalDays of [7, 1000, '66', null]) {
        await api().post('/climbs').set(auth()).send({ goalDays }).expect(400);
      }
      await api().post('/climbs').set(auth()).send({}).expect(400);
    });

    it('changes the length of the current climb and keeps the days climbed', async () => {
      await api()
        .patch('/climbs/current')
        .set(auth())
        .send({ goalDays: 100 })
        .expect(404); // no climb yet

      const read = await createHabit('Read');
      await mark(read, today);
      await startClimb(66);

      const res = await api()
        .patch('/climbs/current')
        .set(auth())
        .send({ goalDays: 100 })
        .expect(200);
      expect((res.body as StatsResponse).climb).toMatchObject({
        goalDays: 100,
        journeyDays: 1,
      });
    });

    it('finishes a climb, then starts the next one today', async () => {
      // The habit started 10 days ago; let it go back 40 days for this test.
      const read = await createHabit('Read');
      await prisma.habit.update({
        where: { id: read },
        data: { startDate: toDbDate(daysAgo(40)) },
      });
      await prisma.user.updateMany({
        data: { createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
      });

      await fillDays(read, 29);
      await startClimb(30);
      // 29 of 30 days: not yet, so a new climb can't start.
      await startClimb(66, 409);

      await mark(read, daysAgo(29)); // the 30th day
      const done = await getStats();
      expect(done.climb).toMatchObject({ journeyDays: 30, isComplete: true });
      expect(done.climbsCompleted).toBe(1);

      // The next climb starts today, so only today's tick counts on the new hill.
      const next = await startClimb(66);
      expect(next.climb).toEqual({
        goalDays: 66,
        startDate: today,
        journeyDays: 1,
        isComplete: false,
      });
      expect(next.climbsCompleted).toBe(1);
      expect(next.journeyDays).toBe(30); // the all-time number keeps everything
    });

    it('keeps each user’s climb separate', async () => {
      await startClimb(30);
      const bob = await registerUser(app, 'bob@example.com', TASHKENT);
      const res = await api()
        .get('/stats')
        .set({ Authorization: `Bearer ${bob}` })
        .expect(200);
      expect((res.body as StatsResponse).climb).toBeNull();
    });

    it('requires login', async () => {
      await api().post('/climbs').send({ goalDays: 66 }).expect(401);
      await api().patch('/climbs/current').send({ goalDays: 66 }).expect(401);
    });
  });
});
