import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { IsCalendarDate } from '../common/dates/is-calendar-date.decorator';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { INSIGHT_RANGES, type InsightRange } from './insights';
import { StatsService } from './stats.service';

/**
 * Query string for GET /insights, e.g. ?range=month&date=2026-10-15.
 * Missing range = week; missing date = today (this week, month or year).
 */
export class InsightsQueryDto {
  @IsOptional()
  @IsIn(INSIGHT_RANGES, {
    message: `range must be one of: ${INSIGHT_RANGES.join(', ')}`,
  })
  range?: InsightRange;

  // Any day in the period to show; the apps step back with ‹ and forward with ›.
  @IsOptional()
  @IsCalendarDate()
  date?: string;
}

@Controller('insights')
@UseGuards(AuthGuard)
export class InsightsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /insights?range=week|month|year&date=YYYY-MM-DD
  //   -> { range, from, to, isCurrent, hasEarlier, dayStreak, bestStreak,
  //        completionRate, previousRate, bars, topHabits }
  @Get()
  get(@CurrentAuth() auth: AuthContext, @Query() query: InsightsQueryDto) {
    return this.statsService.insights(
      auth.userId,
      query.range ?? 'week',
      query.date,
    );
  }
}
