import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { INSIGHT_RANGES, type InsightRange } from './insights';
import { StatsService } from './stats.service';

/** Query string for GET /insights, e.g. ?range=month. Missing = this week. */
export class InsightsQueryDto {
  @IsOptional()
  @IsIn(INSIGHT_RANGES, {
    message: `range must be one of: ${INSIGHT_RANGES.join(', ')}`,
  })
  range?: InsightRange;
}

@Controller('insights')
@UseGuards(AuthGuard)
export class InsightsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /insights?range=week|month|year
  //   -> { range, from, to, dayStreak, completionRate, bars, topHabits }
  @Get()
  get(@CurrentAuth() auth: AuthContext, @Query() query: InsightsQueryDto) {
    return this.statsService.insights(auth.userId, query.range ?? 'week');
  }
}
