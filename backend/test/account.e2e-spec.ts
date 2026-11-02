import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createBackdatedHabit, createTestApp, registerUser } from './helpers';

const EMAIL = 'ali@example.com';
const PASSWORD = 'password123'; // what registerUser uses

describe('Change password and delete account (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function login(password: string, status = 200): Promise<string> {
    const res = await api()
      .post('/auth/login')
      .send({ email: EMAIL, password })
      .expect(status);
    return (res.body as { accessToken: string }).accessToken;
  }

  // ---------- PATCH /me/password ----------

  describe('PATCH /me/password', () => {
    it('changes the password: the old one stops working, the new one works', async () => {
      const token = await registerUser(app, EMAIL);

      await api()
        .patch('/me/password')
        .set(auth(token))
        .send({ currentPassword: PASSWORD, newPassword: 'brand-new-pass' })
        .expect(204);

      await login(PASSWORD, 401);
      await login('brand-new-pass');
    });

    it('ends every other login, but keeps this one', async () => {
      const here = await registerUser(app, EMAIL);
      const otherPhone = await login(PASSWORD);

      await api()
        .patch('/me/password')
        .set(auth(here))
        .send({ currentPassword: PASSWORD, newPassword: 'brand-new-pass' })
        .expect(204);

      await api().get('/me').set(auth(here)).expect(200);
      await api().get('/me').set(auth(otherPhone)).expect(401);
    });

    it('refuses a wrong current password with 400 (not 401, which would log you out)', async () => {
      const token = await registerUser(app, EMAIL);
      const res = await api()
        .patch('/me/password')
        .set(auth(token))
        .send({ currentPassword: 'wrong-pass', newPassword: 'brand-new-pass' })
        .expect(400);
      expect((res.body as { message: string }).message).toBe(
        'That password is not right.',
      );
      await login(PASSWORD); // nothing changed
    });

    it('refuses a too short or unchanged new password', async () => {
      const token = await registerUser(app, EMAIL);
      for (const newPassword of ['short', PASSWORD]) {
        await api()
          .patch('/me/password')
          .set(auth(token))
          .send({ currentPassword: PASSWORD, newPassword })
          .expect(400);
      }
    });

    it('requires login', async () => {
      await api()
        .patch('/me/password')
        .send({ currentPassword: PASSWORD, newPassword: 'brand-new-pass' })
        .expect(401);
    });
  });

  // ---------- DELETE /me ----------

  describe('DELETE /me', () => {
    it('deletes the account and everything in it', async () => {
      const token = await registerUser(app, EMAIL);
      await createBackdatedHabit(app, token, 'Read');
      await api().post('/climbs').set(auth(token)).send({ goalDays: 66 });
      const bob = await registerUser(app, 'bob@example.com');
      await createBackdatedHabit(app, bob, 'Bob’s habit');

      await api()
        .delete('/me')
        .set(auth(token))
        .send({ password: PASSWORD })
        .expect(204);

      // The login has ended, and the account can't log in any more.
      await api().get('/me').set(auth(token)).expect(401);
      await login(PASSWORD, 401);
      // Ali's habits and climbs are gone; Bob's are untouched.
      expect(await prisma.habit.count()).toBe(1);
      expect(await prisma.climb.count()).toBe(0);
    });

    it('keeps the account when the password is wrong', async () => {
      const token = await registerUser(app, EMAIL);
      await api()
        .delete('/me')
        .set(auth(token))
        .send({ password: 'wrong-pass' })
        .expect(400);
      await api().delete('/me').set(auth(token)).send({}).expect(400);
      await api().get('/me').set(auth(token)).expect(200);
    });

    it('requires login', async () => {
      await api().delete('/me').send({ password: PASSWORD }).expect(401);
    });
  });
});
