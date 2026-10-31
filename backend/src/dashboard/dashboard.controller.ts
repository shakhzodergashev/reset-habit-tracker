import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard -> { today, timeZone, completedCount, totalCount, journeyDays, habits }
  @Get()
  get(@CurrentAuth() auth: AuthContext) {
    return this.dashboardService.get(auth.userId);
  }
}
