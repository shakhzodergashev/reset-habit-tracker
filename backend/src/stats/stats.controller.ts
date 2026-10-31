import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /stats -> { today, yearDays, habitCount, journeyDays, perfectDays, activeDays, totalCompletions }
  @Get()
  get(@CurrentAuth() auth: AuthContext) {
    return this.statsService.get(auth.userId);
  }
}
