import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { DashboardQueryDto } from './dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard?date=YYYY-MM-DD (optional, default today)
  //   -> { today, date, timeZone, completedCount, totalCount, habits }
  //   Each habit also has completedOnDate: done on that date or not.
  @Get()
  get(@CurrentAuth() auth: AuthContext, @Query() query: DashboardQueryDto) {
    return this.dashboardService.get(auth.userId, query.date);
  }
}
