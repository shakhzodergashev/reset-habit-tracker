import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { addDays, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createBackdatedHabit,
  createTestApp,
  markDone,
  registerUser,
} from './helpers';

interface HabitResponse {
  id: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
}

interface DashboardResponse {
  today: string;
  timeZone: string;
  completedCount: number;
  totalCount: number;
  habits: HabitResponse[];
}

const TASHKENT = 'Asia/Tashkent';

describe('Streaks and dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let aliToken: string;
  let today: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    aliToken = await registerUser(app, 'ali@example.com', TASHKENT);
    today = todayInTimeZone(TASHKENT);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- small helpers ----------

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const daysAgo = (n: number) => addDays(today, -n);

  const createHabit = (token: string, name: string) =>
    createBackdatedHabit(app, token, name);
  const mark = (habitId: string, date: string) =>
    markDone(app, aliToken, habitId, date);

  async function unmark(habitId: string, date: string) {
    await api()
      .delete(`/habits/${habitId}/completions/${date}`)
      .set(auth(aliToken))
      .expect(204);
  }

  async function getHabit(habitId: string): Promise<HabitResponse> {
    const res = await api()
      .get(`/habits/${habitId}`)
      .set(auth(aliToken))
      .expect(200);
    return res.body as HabitResponse;
  }

  async function getDashboard(token: string): Promise<DashboardResponse> {
    const res = await api().get('/dashboard').set(auth(token)).expect(200);
    return res.body as DashboardResponse;
  }

  // ---------- streaks through the API ----------

  describe('currentStreak and completedToday', () => {
    it('start at 0 for a new habit', async () => {
      const habitId = await createHabit(aliToken, 'Read');

      expect(await getHabit(habitId)).toMatchObject({
        currentStreak: 0,
        completedToday: false,
      });
    });

    it('keep the streak alive while today is not done yet', async () => {
      const habitId = await createHabit(aliToken, 'Read');
      await mark(habitId, daysAgo(2));
      await mark(habitId, daysAgo(1));

      expect(await getHabit(habitId)).toMatchObject({
        currentStreak: 2,
        completedToday: false,
      });

      await mark(habitId, today);
      expect(await getHabit(habitId)).toMatchObject({
        currentStreak: 3,
        completedToday: true,
      });
    });

    it('break after a missed day and start again at 1', async () => {
      const habitId = await createHabit(aliToken, 'Read');
      await mark(habitId, daysAgo(3));
      await mark(habitId, daysAgo(2));
      // yesterday missed

      expect((await getHabit(habitId)).currentStreak).toBe(0);

      await mark(habitId, today);
      expect((await getHabit(habitId)).currentStreak).toBe(1);
      // The best streak remembers the earlier run of 2.
      expect((await getHabit(habitId)).bestStreak).toBe(2);
    });

    it('update immediately when a past day is changed', async () => {
      const habitId = await createHabit(aliToken, 'Read');
      await mark(habitId, daysAgo(2));
      await mark(habitId, today);
      expect((await getHabit(habitId)).currentStreak).toBe(1);

      await mark(habitId, daysAgo(1)); // fill in the forgotten day
      expect((await getHabit(habitId)).currentStreak).toBe(3);

      await unmark(habitId, daysAgo(1)); // and take it away again
      expect((await getHabit(habitId)).currentStreak).toBe(1);
    });
  });

  // ---------- GET /dashboard ----------

  describe('GET /dashboard', () => {
    it('shows today in the user’s time zone, with empty counts at first', async () => {
      expect(await getDashboard(aliToken)).toEqual({
        today,
        date: today,
        timeZone: TASHKENT,
        completedCount: 0,
        totalCount: 0,
        habits: [],
      });
    });

    it('counts today’s completions and lists unfinished habits first', async () => {
      const first = await createHabit(aliToken, 'First');
      const second = await createHabit(aliToken, 'Second');
      await createHabit(aliToken, 'Third');

      await mark(first, today);
      await mark(second, daysAgo(1)); // a past day does not count as done today

      const dashboard = await getDashboard(aliToken);
      expect(dashboard.completedCount).toBe(1);
      expect(dashboard.totalCount).toBe(3);
      // Unfinished first (oldest first inside each group), then the finished one.
      expect(dashboard.habits.map((h) => h.name)).toEqual([
        'Second',
        'Third',
        'First',
      ]);
      expect(dashboard.habits[0].currentStreak).toBe(1); // yesterday still counts
    });

    it('leaves archived habits out', async () => {
      const kept = await createHabit(aliToken, 'Kept');
      const archived = await createHabit(aliToken, 'Archived');
      await mark(kept, today);
      await mark(archived, today);
      await api()
        .post(`/habits/${archived}/archive`)
        .set(auth(aliToken))
        .expect(200);

      const dashboard = await getDashboard(aliToken);
      expect(dashboard.habits.map((h) => h.name)).toEqual(['Kept']);
      expect(dashboard.completedCount).toBe(1);
      expect(dashboard.totalCount).toBe(1);
    });

    it('uses each user’s own time zone for "today"', async () => {
      const token = await registerUser(
        app,
        'early@example.com',
        'Pacific/Kiritimati',
      );

      const dashboard = await getDashboard(token);
      expect(dashboard.today).toBe(todayInTimeZone('Pacific/Kiritimati'));
      expect(dashboard.timeZone).toBe('Pacific/Kiritimati');
    });

    it('only shows the user’s own habits', async () => {
      await createHabit(aliToken, 'Ali’s habit');
      const bobToken = await registerUser(app, 'bob@example.com', TASHKENT);

      const bobDashboard = await getDashboard(bobToken);
      expect(bobDashboard.totalCount).toBe(0);
      expect(bobDashboard.habits).toEqual([]);
    });

    it('shows any past day picked in the week strip', async () => {
      const read = await createHabit(aliToken, 'Read');
      const run = await createHabit(aliToken, 'Run');
      await mark(run, daysAgo(2));

      const res = await api()
        .get(`/dashboard?date=${daysAgo(2)}`)
        .set(auth(aliToken))
        .expect(200);
      const body = res.body as {
        date: string;
        completedCount: number;
        totalCount: number;
        habits: { id: string; completedOnDate: boolean }[];
      };
      expect(body.date).toBe(daysAgo(2));
      expect(body.completedCount).toBe(1);
      expect(body.totalCount).toBe(2);
      // Not done that day first, then done.
      expect(body.habits.map((h) => [h.id, h.completedOnDate])).toEqual([
        [read, false],
        [run, true],
      ]);

      // A habit that started later does not appear on that day.
      await api()
        .post('/habits')
        .set(auth(aliToken))
        .send({ name: 'New' })
        .expect(201);
      const before = await api()
        .get(`/dashboard?date=${daysAgo(2)}`)
        .set(auth(aliToken))
        .expect(200);
      expect((before.body as { totalCount: number }).totalCount).toBe(2);
    });

    it('rejects a future or invalid date', async () => {
      for (const date of [addDays(today, 1), '2026-02-30', 'yesterday']) {
        await api()
          .get(`/dashboard?date=${date}`)
          .set(auth(aliToken))
          .expect(400);
      }
    });

    it('requires login', async () => {
      await api().get('/dashboard').expect(401);
    });
  });
});
