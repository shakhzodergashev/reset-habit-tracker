import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Cost factor: each +1 doubles the hashing time. 12 takes roughly 0.2 seconds.
export const BCRYPT_ROUNDS = 12;

// How long a login lasts: 7 days.
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

// Used when the email does not exist, so a failed login always takes the same time.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

type PublicUser = Pick<User, 'id' | 'email' | 'timeZone' | 'createdAt'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: PublicUser;
    try {
      user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash, timeZone: dto.timeZone },
        // Never send the password hash back to the client.
        select: { id: true, email: true, timeZone: true, createdAt: true },
      });
    } catch (error) {
      // P2002 = unique constraint failed, i.e. this email is already registered.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    // Log the new user in straight away.
    return this.startSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always run bcrypt, even for unknown emails, so the response time
    // does not reveal which emails are registered.
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      // Same message for both cases, for the same reason.
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.startSession(user);
  }

  /** Ends one session. Its token is rejected by AuthGuard from now on. */
  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /** Creates a session row and a signed token that points to it. */
  private async startSession(user: PublicUser) {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_SECONDS * 1000),
      },
    });

    // sub = "subject" (the user), sid = session id. Logout will revoke the session.
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, sid: session.id },
      { expiresIn: SESSION_DURATION_SECONDS },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        timeZone: user.timeZone,
        createdAt: user.createdAt,
      },
    };
  }
}
