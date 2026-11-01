import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { ClimbDto } from './dto/climb.dto';
import { StatsService } from './stats.service';

/** Both answer with the same body as GET /stats, so the app can just show it. */
@Controller('climbs')
@UseGuards(AuthGuard)
export class ClimbsController {
  constructor(private readonly statsService: StatsService) {}

  // POST /climbs { goalDays } -> start the first climb, or the next one after finishing
  @Post()
  start(@CurrentAuth() auth: AuthContext, @Body() dto: ClimbDto) {
    return this.statsService.startClimb(auth.userId, dto.goalDays);
  }

  // PATCH /climbs/current { goalDays } -> change how long the current climb is
  @Patch('current')
  changeLength(@CurrentAuth() auth: AuthContext, @Body() dto: ClimbDto) {
    return this.statsService.changeClimbLength(auth.userId, dto.goalDays);
  }
}
