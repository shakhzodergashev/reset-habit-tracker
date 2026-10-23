import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthContext, AuthenticatedRequest } from './auth.types';

/**
 * Gives an endpoint the logged-in user's ids: `@CurrentAuth() auth: AuthContext`.
 * Only works on endpoints protected by AuthGuard.
 */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) {
      // Safety net: someone used @CurrentAuth() without AuthGuard.
      throw new UnauthorizedException();
    }
    return request.auth;
  },
);
