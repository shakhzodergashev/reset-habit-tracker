import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

interface PublicUser {
  id: string;
  email: string;
  timeZone: string;
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

const ALI = {
  email: 'ali@example.com',
  password: 'password123',
  timeZone: 'Asia/Tashkent',
};

describe('Accounts (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app); // same settings as the real server
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Start every test with an empty database.
    // Deleting users also deletes their sessions and habits (onDelete: Cascade).
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- small helpers ----------

  const api = () => request(app.getHttpServer());

  async function registerAli(): Promise<AuthResponse> {
    const res = await api().post('/auth/register').send(ALI).expect(201);
    return res.body as AuthResponse;
  }

  // Not async: returning the request itself keeps `.expect(...)` available.
  function login(email: string, password: string) {
    return api().post('/auth/login').send({ email, password });
  }

  // ---------- POST /auth/register ----------

  describe('POST /auth/register', () => {
    it('creates an account and logs the user in', async () => {
      const body = await registerAli();

      expect(typeof body.accessToken).toBe('string');
      expect(Object.keys(body.user).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'timeZone',
      ]); // exactly these fields, so no password hash
      expect(body.user.email).toBe('ali@example.com');
      expect(body.user.timeZone).toBe('Asia/Tashkent');
    });

    it('stores a bcrypt hash, never the real password', async () => {
      await registerAli();

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: ALI.email },
      });
      expect(user.passwordHash).not.toBe(ALI.password);
      expect(user.passwordHash).toMatch(/^\$2b\$12\$/);
    });

    it('lowercases and trims the email', async () => {
      const res = await api()
        .post('/auth/register')
        .send({ ...ALI, email: '  Ali@Example.COM ' })
        .expect(201);

      expect((res.body as AuthResponse).user.email).toBe('ali@example.com');
    });

    it('uses UTC when no time zone is sent', async () => {
      const res = await api()
        .post('/auth/register')
        .send({ email: ALI.email, password: ALI.password })
        .expect(201);

      expect((res.body as AuthResponse).user.timeZone).toBe('UTC');
    });

    it('rejects an email that is already registered (any letter case)', async () => {
      await registerAli();

      await api()
        .post('/auth/register')
        .send({ ...ALI, email: 'ALI@example.com' })
        .expect(409);
    });

    it('rejects invalid input', async () => {
      await api()
        .post('/auth/register')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);

      await api()
        .post('/auth/register')
        .send({ ...ALI, timeZone: 'Mars/Phobos' })
        .expect(400);

      // bcrypt only uses 72 bytes, so longer passwords are refused.
      await api()
        .post('/auth/register')
        .send({ ...ALI, password: 'a'.repeat(73) })
        .expect(400);
    });

    it('rejects fields that are not allowed', async () => {
      await api()
        .post('/auth/register')
        .send({ ...ALI, isAdmin: true })
        .expect(400);
    });
  });

  // ---------- POST /auth/login ----------

  describe('POST /auth/login', () => {
    it('returns a token for the right password', async () => {
      await registerAli();

      const res = await login(ALI.email, ALI.password).expect(200);
      const body = res.body as AuthResponse;
      expect(typeof body.accessToken).toBe('string');
      expect(body.user.email).toBe(ALI.email);
    });

    it('gives the same 401 for a wrong password and an unknown email', async () => {
      await registerAli();

      const wrongPassword = await login(ALI.email, 'wrong-password').expect(
        401,
      );
      const unknownEmail = await login(
        'nobody@example.com',
        ALI.password,
      ).expect(401);

      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });
  });

  // ---------- GET /me ----------

  describe('GET /me', () => {
    it('returns the logged-in user', async () => {
      const { accessToken } = await registerAli();

      const res = await api()
        .get('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect((res.body as PublicUser).email).toBe(ALI.email);
    });

    it('rejects a request without a token', async () => {
      await api().get('/me').expect(401);
    });

    it('rejects a token whose contents were changed', async () => {
      const { accessToken } = await registerAli();

      // Swap the middle part (the contents) for fake contents.
      // The signature no longer matches, so the token must be refused.
      const [header, , signature] = accessToken.split('.');
      const fakeContents = Buffer.from(
        JSON.stringify({ sub: 'someone-else', sid: 'fake' }),
      ).toString('base64url');

      await api()
        .get('/me')
        .set('Authorization', `Bearer ${header}.${fakeContents}.${signature}`)
        .expect(401);
    });

    it('rejects a token whose session has expired', async () => {
      const { accessToken } = await registerAli();

      // Pretend a week has passed: move the session's end time into the past.
      await prisma.session.updateMany({
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await api()
        .get('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  // ---------- PATCH /me ----------

  describe('PATCH /me', () => {
    it('changes the time zone', async () => {
      const { accessToken } = await registerAli();

      const res = await api()
        .patch('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ timeZone: 'Europe/London' })
        .expect(200);

      expect((res.body as PublicUser).timeZone).toBe('Europe/London');
    });

    it('rejects a fake time zone and any other field', async () => {
      const { accessToken } = await registerAli();

      await api()
        .patch('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ timeZone: 'Mars/Phobos' })
        .expect(400);

      await api()
        .patch('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ timeZone: 'Europe/London', email: 'hacker@example.com' })
        .expect(400);
    });
  });

  // ---------- POST /auth/logout ----------

  describe('POST /auth/logout', () => {
    it('makes the token stop working', async () => {
      const { accessToken } = await registerAli();

      await api()
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await api()
        .get('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('only ends the current session, not other logins', async () => {
      await registerAli();
      const laptop = (await login(ALI.email, ALI.password))
        .body as AuthResponse;
      const phone = (await login(ALI.email, ALI.password)).body as AuthResponse;

      await api()
        .post('/auth/logout')
        .set('Authorization', `Bearer ${laptop.accessToken}`)
        .expect(204);

      await api()
        .get('/me')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(200);
    });
  });
});
