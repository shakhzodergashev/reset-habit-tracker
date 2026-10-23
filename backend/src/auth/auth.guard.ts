import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest, JwtPayload } from './auth.types';

/**
 * Lets a request through only if it has a valid token AND its session
 * is still active in the database (not logged out, not expired).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Is there a token? It must be sent as "Authorization: Bearer <token>".
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    // 2. Is it genuine (signed with our secret) and not expired?
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    // 3 + 4. Does the session still exist, belong to this user, and is it still active?
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException();
    }

    // Tell the endpoint who is asking.
    request.auth = { userId: session.userId, sessionId: session.id };
    return true;
  }

  private extractBearerToken(
    request: AuthenticatedRequest,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
