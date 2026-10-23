import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { UsersService } from './users.service';

@Controller('me')
@UseGuards(AuthGuard) // every route in this controller requires login
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /me -> the logged-in user's own profile
  @Get()
  getMe(@CurrentAuth() auth: AuthContext) {
    return this.usersService.getMe(auth.userId);
  }
}
