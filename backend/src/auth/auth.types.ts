import { Request } from 'express';

/** What we put inside every token. */
export interface JwtPayload {
  sub: string; // user id
  sid: string; // session id
}

/** Who is making the request, attached by AuthGuard. */
export interface AuthContext {
  userId: string;
  sessionId: string;
}

export type AuthenticatedRequest = Request & { auth?: AuthContext };
