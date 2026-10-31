import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { addDays, toDbDate, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser } from './helpers';

interface HabitResponse {
  id: string;
  name: string;
  currentStreak: number;
  completedToday: boolean;
}

interface DashboardResponse {
  today: string;
  timeZone: string;
  completedCount: number;
  totalCount: number;
  journeyDays: number;
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

  /** Creates a habit that "started" 10 days ago, so past days can be marked. */
  async function createHabit(token: string, name: string): Promise<string> {
    const res = await api()
      .post('/habits')
      .set(auth(token))
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
      .set(auth(aliToken))
      .expect(200);
  }

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
        timeZone: TASHKENT,
        completedCount: 0,
        totalCount: 0,
        journeyDays: 0,
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

    it('climbs a share of a day for each habit done that day', async () => {
      const read = await createHabit(aliToken, 'Read');
      const run = await createHabit(aliToken, 'Run');

      await mark(read, daysAgo(5)); // 1 of 2 habits = half a day
      await mark(read, daysAgo(4));
      await mark(run, daysAgo(4)); // 2 of 2 = a full day
      // days 3, 2 and 1 missed: the journey pauses, it does not go down
      expect((await getDashboard(aliToken)).journeyDays).toBe(1.5);

      // A third habit, starting today: from today on, each habit is a third of a day.
      await api()
        .post('/habits')
        .set(auth(aliToken))
        .send({ name: 'Walk' })
        .expect(201);
      await mark(run, today);
      expect((await getDashboard(aliToken)).journeyDays).toBe(1.83);

      // Undoing takes that share back out.
      await unmark(run, today);
      expect((await getDashboard(aliToken)).journeyDays).toBe(1.5);

      // Each user has their own journey.
      const bobToken = await registerUser(app, 'bob@example.com', TASHKENT);
      expect((await getDashboard(bobToken)).journeyDays).toBe(0);
    });

    it('requires login', async () => {
      await api().get('/dashboard').expect(401);
    });
  });
});
