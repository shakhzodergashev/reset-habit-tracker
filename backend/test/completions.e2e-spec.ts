import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { addDays, toDbDate, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser } from './helpers';

const TASHKENT = 'Asia/Tashkent';

describe('Completions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let aliToken: string;
  let bobToken: string;

  // Ali's dates, worked out the same way the app does.
  let today: string;
  let yesterday: string;
  let tomorrow: string;
  let startDate: string; // the habit "started" 10 days ago (see createHabit)

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    aliToken = await registerUser(app, 'ali@example.com', TASHKENT);
    bobToken = await registerUser(app, 'bob@example.com', 'Europe/London');

    today = todayInTimeZone(TASHKENT);
    yesterday = addDays(today, -1);
    tomorrow = addDays(today, 1);
    startDate = addDays(today, -10);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- small helpers ----------

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /**
   * Creates a habit, then moves its start date 10 days back in the test database,
   * as if it had been created earlier, so past days can be marked.
   */
  async function createHabit(token: string, daysAgo = 10): Promise<string> {
    const res = await api()
      .post('/habits')
      .set(auth(token))
      .send({ name: 'Read', color: '#22AA88' })
      .expect(201);
    const habit = res.body as { id: string; startDate: string };

    await prisma.habit.update({
      where: { id: habit.id },
      data: { startDate: toDbDate(addDays(habit.startDate, -daysAgo)) },
    });
    return habit.id;
  }

  const completionsUrl = (habitId: string, date = '') =>
    `/habits/${habitId}/completions${date ? `/${date}` : ''}`;

  async function listDays(token: string, habitId: string, query = '') {
    const res = await api()
      .get(completionsUrl(habitId) + query)
      .set(auth(token))
      .expect(200);
    return res.body as string[];
  }

  // ---------- PUT: mark as done ----------

  describe('PUT /habits/:habitId/completions/:date', () => {
    it('marks today and past days', async () => {
      const habitId = await createHabit(aliToken);

      for (const date of [today, yesterday, startDate]) {
        const res = await api()
          .put(completionsUrl(habitId, date))
          .set(auth(aliToken))
          .expect(200);
        expect(res.body).toEqual({ habitId, date });
      }

      expect(await listDays(aliToken, habitId)).toEqual([
        startDate,
        yesterday,
        today,
      ]);
    });

    it('is safe to repeat: still only one completion per day', async () => {
      const habitId = await createHabit(aliToken);

      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(200);
      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(200);

      expect(await prisma.habitCompletion.count({ where: { habitId } })).toBe(
        1,
      );
    });

    it('rejects future dates', async () => {
      const habitId = await createHabit(aliToken);

      await api()
        .put(completionsUrl(habitId, tomorrow))
        .set(auth(aliToken))
        .expect(400);
    });

    it('rejects dates before the habit started', async () => {
      const habitId = await createHabit(aliToken);

      await api()
        .put(completionsUrl(habitId, addDays(startDate, -1)))
        .set(auth(aliToken))
        .expect(400);
    });

    it('rejects dates that are not real or not YYYY-MM-DD', async () => {
      const habitId = await createHabit(aliToken);

      for (const date of ['2026-02-30', '2026-13-01', '26-10-2026', 'today']) {
        await api()
          .put(completionsUrl(habitId, date))
          .set(auth(aliToken))
          .expect(400);
      }
    });

    it('decides "the future" using each user’s own time zone', async () => {
      // Kiritimati (UTC+14) and Pago Pago (UTC-11) are always on different dates.
      const early = await registerUser(
        app,
        'early@example.com',
        'Pacific/Kiritimati',
      );
      const late = await registerUser(
        app,
        'late@example.com',
        'Pacific/Pago_Pago',
      );
      const earlyHabit = await createHabit(early);
      const lateHabit = await createHabit(late);

      const kiritimatiToday = todayInTimeZone('Pacific/Kiritimati');

      // Today in Kiritimati: fine for the Kiritimati user...
      await api()
        .put(completionsUrl(earlyHabit, kiritimatiToday))
        .set(auth(early))
        .expect(200);
      // ...but still tomorrow for the Pago Pago user.
      await api()
        .put(completionsUrl(lateHabit, kiritimatiToday))
        .set(auth(late))
        .expect(400);
    });
  });

  // ---------- DELETE: undo ----------

  describe('DELETE /habits/:habitId/completions/:date', () => {
    it('removes a completion and is safe to repeat', async () => {
      const habitId = await createHabit(aliToken);
      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(200);

      await api()
        .delete(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(204);
      await api()
        .delete(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(204);

      expect(await listDays(aliToken, habitId)).toEqual([]);
    });
  });

  // ---------- archived habits (approved decision 4) ----------

  describe('archived habits', () => {
    it('cannot be marked or undone, but keep their history', async () => {
      const habitId = await createHabit(aliToken);
      await api()
        .put(completionsUrl(habitId, yesterday))
        .set(auth(aliToken))
        .expect(200);
      await api()
        .post(`/habits/${habitId}/archive`)
        .set(auth(aliToken))
        .expect(200);

      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(409);
      await api()
        .delete(completionsUrl(habitId, yesterday))
        .set(auth(aliToken))
        .expect(409);

      // History is still there and still readable.
      expect(await listDays(aliToken, habitId)).toEqual([yesterday]);

      // After restoring, changes work again.
      await api()
        .post(`/habits/${habitId}/restore`)
        .set(auth(aliToken))
        .expect(200);
      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(200);
    });
  });

  // ---------- GET: list ----------

  describe('GET /habits/:habitId/completions', () => {
    it('filters by from and to', async () => {
      const habitId = await createHabit(aliToken);
      for (const date of [startDate, yesterday, today]) {
        await api()
          .put(completionsUrl(habitId, date))
          .set(auth(aliToken))
          .expect(200);
      }

      expect(await listDays(aliToken, habitId, `?from=${yesterday}`)).toEqual([
        yesterday,
        today,
      ]);
      expect(await listDays(aliToken, habitId, `?to=${yesterday}`)).toEqual([
        startDate,
        yesterday,
      ]);
      expect(
        await listDays(aliToken, habitId, `?from=${yesterday}&to=${yesterday}`),
      ).toEqual([yesterday]);
    });

    it('rejects a backwards range or a fake date', async () => {
      const habitId = await createHabit(aliToken);

      await api()
        .get(`${completionsUrl(habitId)}?from=${today}&to=${yesterday}`)
        .set(auth(aliToken))
        .expect(400);
      await api()
        .get(`${completionsUrl(habitId)}?from=2026-02-30`)
        .set(auth(aliToken))
        .expect(400);
    });
  });

  // ---------- ownership ----------

  describe('another user', () => {
    it('gets 404 for every completion action', async () => {
      const habitId = await createHabit(aliToken);
      await api()
        .put(completionsUrl(habitId, today))
        .set(auth(aliToken))
        .expect(200);

      await api().get(completionsUrl(habitId)).set(auth(bobToken)).expect(404);
      await api()
        .put(completionsUrl(habitId, yesterday))
        .set(auth(bobToken))
        .expect(404);
      await api()
        .delete(completionsUrl(habitId, today))
        .set(auth(bobToken))
        .expect(404);

      // Ali's data is untouched.
      expect(await listDays(aliToken, habitId)).toEqual([today]);
    });

    it('requires login', async () => {
      const habitId = await createHabit(aliToken);
      await api().put(completionsUrl(habitId, today)).expect(401);
    });
  });
});
