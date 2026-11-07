import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser } from './helpers';

describe('Security (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    process.env.RATE_LIMIT_OFF = '1'; // back to how the other tests expect it
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('answers the health check without logging in', async () => {
    const res = await api().get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('sends security headers on every response', async () => {
    const res = await api().get('/me').expect(401);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined(); // don't advertise the server
  });

  it('blocks the 6th login try within a minute', async () => {
    await registerUser(app, 'ali@example.com');
    process.env.RATE_LIMIT_OFF = '0'; // turn the limit on, for this test only
    try {
      const wrong = { email: 'ali@example.com', password: 'not-the-password' };
      for (let attempt = 1; attempt <= 5; attempt++) {
        await api().post('/auth/login').send(wrong).expect(401);
      }

      // Even the right password is refused now: the guessing has to stop.
      const blocked = await api()
        .post('/auth/login')
        .send({ email: 'ali@example.com', password: 'password123' })
        .expect(429);
      expect((blocked.body as { message: string }).message).toBe(
        'Too many requests. Please wait a minute and try again.',
      );
    } finally {
      process.env.RATE_LIMIT_OFF = '1';
    }
  });
});
