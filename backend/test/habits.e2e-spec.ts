import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { toDbDate, todayInTimeZone } from '../src/common/dates/dates';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser } from './helpers';

interface HabitResponse {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  startDate: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const READING = {
  name: 'Read 20 pages',
  description: 'Before bed',
};
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Habits (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let aliToken: string; // the owner in most tests
  let bobToken: string; // another user, who must never reach Ali's habits

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    // Start every test with an empty database (cascade removes habits too).
    await prisma.user.deleteMany();
    aliToken = await registerUser(app, 'ali@example.com', 'Asia/Tashkent');
    bobToken = await registerUser(app, 'bob@example.com', 'Europe/London');
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- small helpers ----------

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function createHabit(
    token: string,
    body: object = READING,
  ): Promise<HabitResponse> {
    const res = await api()
      .post('/habits')
      .set(auth(token))
      .send(body)
      .expect(201);
    return res.body as HabitResponse;
  }

  async function listHabits(token: string, query = '') {
    const res = await api().get(`/habits${query}`).set(auth(token)).expect(200);
    return (res.body as HabitResponse[]).map((h) => h.name);
  }

  // ---------- POST /habits ----------

  describe('POST /habits', () => {
    it('creates a habit that starts today in the user’s time zone', async () => {
      const habit = await createHabit(aliToken, {
        name: '  Read 20 pages ',
      });

      expect(habit.name).toBe('Read 20 pages'); // trimmed
      expect(habit.description).toBeNull();
      expect(habit.emoji).toBeNull();
      expect(habit.isArchived).toBe(false);
      expect(habit.startDate).toBe(todayInTimeZone('Asia/Tashkent'));
      expect(habit).not.toHaveProperty('userId');
    });

    it('turns an empty description into null', async () => {
      const habit = await createHabit(aliToken, {
        ...READING,
        description: '  ',
      });
      expect(habit.description).toBeNull();
    });

    it('stores the user’s own emoji; empty means none', async () => {
      for (const emoji of ['📚', '🏃‍♀️', '👍🏽', '🇺🇿']) {
        const habit = await createHabit(aliToken, { ...READING, emoji });
        expect(habit.emoji).toBe(emoji);
      }

      const empty = await createHabit(aliToken, { ...READING, emoji: ' ' });
      expect(empty.emoji).toBeNull();
    });

    it('rejects invalid input', async () => {
      const bad = [
        { ...READING, name: '' },
        { ...READING, name: 'x'.repeat(101) },
        { ...READING, emoji: 'book' }, // text, not an emoji
        { ...READING, emoji: '📚📚' }, // two emojis
        { ...READING, emoji: 5 },
        { ...READING, color: '#22AA88' }, // colours are gone
        { ...READING, description: 'x'.repeat(501) },
        { ...READING, userId: 'someone-else' }, // not an allowed field
      ];
      for (const body of bad) {
        await api().post('/habits').set(auth(aliToken)).send(body).expect(400);
      }
    });

    it('requires login', async () => {
      await api().post('/habits').send(READING).expect(401);
    });
  });

  // ---------- GET /habits ----------

  describe('GET /habits', () => {
    it('lists only the user’s own active habits, oldest first', async () => {
      await createHabit(aliToken, { ...READING, name: 'First' });
      await createHabit(aliToken, { ...READING, name: 'Second' });
      await createHabit(bobToken, { ...READING, name: 'Bob’s habit' });

      expect(await listHabits(aliToken)).toEqual(['First', 'Second']);
      expect(await listHabits(bobToken)).toEqual(['Bob’s habit']);
    });

    it('rejects an invalid archived filter', async () => {
      await api().get('/habits?archived=maybe').set(auth(aliToken)).expect(400);
    });
  });

  // ---------- GET /habits/:id ----------

  describe('GET /habits/:id', () => {
    it('returns the owner’s habit', async () => {
      const habit = await createHabit(aliToken);

      const res = await api()
        .get(`/habits/${habit.id}`)
        .set(auth(aliToken))
        .expect(200);
      expect((res.body as HabitResponse).name).toBe(READING.name);
    });

    it('gives another user the same 404 as a missing habit', async () => {
      const habit = await createHabit(aliToken);

      const otherUser = await api()
        .get(`/habits/${habit.id}`)
        .set(auth(bobToken))
        .expect(404);
      const missing = await api()
        .get(`/habits/${MISSING_ID}`)
        .set(auth(aliToken))
        .expect(404);

      expect(otherUser.body).toEqual(missing.body);
    });

    it('rejects an id that is not a UUID', async () => {
      await api().get('/habits/hello').set(auth(aliToken)).expect(400);
    });
  });

  // ---------- PATCH /habits/:id ----------

  describe('PATCH /habits/:id', () => {
    it('changes the emoji, and null removes it', async () => {
      const habit = await createHabit(aliToken, { ...READING, emoji: '📚' });

      const changed = await api()
        .patch(`/habits/${habit.id}`)
        .set(auth(aliToken))
        .send({ emoji: '😴' })
        .expect(200);
      expect((changed.body as HabitResponse).emoji).toBe('😴');

      const cleared = await api()
        .patch(`/habits/${habit.id}`)
        .set(auth(aliToken))
        .send({ emoji: null })
        .expect(200);
      expect((cleared.body as HabitResponse).emoji).toBeNull();

      // Other fields are left alone when only the emoji changes.
      expect((cleared.body as HabitResponse).name).toBe(READING.name);
    });

    it('renames a habit without losing its identity or start date', async () => {
      const habit = await createHabit(aliToken);

      const res = await api()
        .patch(`/habits/${habit.id}`)
        .set(auth(aliToken))
        .send({ name: 'Read 30 pages' })
        .expect(200);
      const renamed = res.body as HabitResponse;

      expect(renamed.name).toBe('Read 30 pages');
      expect(renamed.id).toBe(habit.id);
      expect(renamed.startDate).toBe(habit.startDate);
      expect(renamed.createdAt).toBe(habit.createdAt);
      // Fields that were not sent stay the same.
      expect(renamed.description).toBe(READING.description);
    });

    it('removes the description when null is sent', async () => {
      const habit = await createHabit(aliToken);

      const res = await api()
        .patch(`/habits/${habit.id}`)
        .set(auth(aliToken))
        .send({ description: null })
        .expect(200);
      expect((res.body as HabitResponse).description).toBeNull();
    });

    it('rejects invalid changes', async () => {
      const habit = await createHabit(aliToken);

      for (const body of [
        { name: '' },
        { emoji: 'sleep' },
        { isArchived: true },
      ]) {
        await api()
          .patch(`/habits/${habit.id}`)
          .set(auth(aliToken))
          .send(body)
          .expect(400);
      }
    });

    it('does not let another user change the habit', async () => {
      const habit = await createHabit(aliToken);

      await api()
        .patch(`/habits/${habit.id}`)
        .set(auth(bobToken))
        .send({ name: 'hacked' })
        .expect(404);

      expect(await listHabits(aliToken)).toEqual([READING.name]);
    });
  });

  // ---------- archive / restore ----------

  describe('archive and restore', () => {
    it('moves a habit between the active and archived lists', async () => {
      const habit = await createHabit(aliToken);

      await api()
        .post(`/habits/${habit.id}/archive`)
        .set(auth(aliToken))
        .expect(200);
      expect(await listHabits(aliToken)).toEqual([]);
      expect(await listHabits(aliToken, '?archived=true')).toEqual([
        READING.name,
      ]);

      await api()
        .post(`/habits/${habit.id}/restore`)
        .set(auth(aliToken))
        .expect(200);
      expect(await listHabits(aliToken)).toEqual([READING.name]);
      expect(await listHabits(aliToken, '?archived=true')).toEqual([]);
    });

    it('is safe to repeat', async () => {
      const habit = await createHabit(aliToken);

      for (let i = 0; i < 2; i++) {
        const res = await api()
          .post(`/habits/${habit.id}/archive`)
          .set(auth(aliToken))
          .expect(200);
        expect((res.body as HabitResponse).isArchived).toBe(true);
      }
    });

    it('keeps the completion history', async () => {
      const habit = await createHabit(aliToken);
      // Completions arrive in Milestone 5, so add one directly to the database.
      await prisma.habitCompletion.create({
        data: { habitId: habit.id, date: toDbDate(habit.startDate) },
      });

      await api()
        .post(`/habits/${habit.id}/archive`)
        .set(auth(aliToken))
        .expect(200);
      await api()
        .post(`/habits/${habit.id}/restore`)
        .set(auth(aliToken))
        .expect(200);

      expect(
        await prisma.habitCompletion.count({ where: { habitId: habit.id } }),
      ).toBe(1);
    });

    it('does not let another user archive or restore', async () => {
      const habit = await createHabit(aliToken);

      for (const action of ['archive', 'restore']) {
        await api()
          .post(`/habits/${habit.id}/${action}`)
          .set(auth(bobToken))
          .expect(404);
      }
      expect(await listHabits(aliToken)).toEqual([READING.name]);
    });
  });
});
