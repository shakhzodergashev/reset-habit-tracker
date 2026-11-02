import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
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

  // PATCH /me -> change the logged-in user's time zone
  @Patch()
  updateMe(@CurrentAuth() auth: AuthContext, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(auth.userId, dto);
  }

  // PATCH /me/password { currentPassword, newPassword } -> 204; other logins end
  @Patch('password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // like login: no password guessing
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(auth.userId, auth.sessionId, dto);
  }

  // DELETE /me { password } -> 204; the account and everything in it are gone
  @Delete()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentAuth() auth: AuthContext, @Body() dto: DeleteMeDto) {
    return this.usersService.deleteMe(auth.userId, dto);
  }
}
