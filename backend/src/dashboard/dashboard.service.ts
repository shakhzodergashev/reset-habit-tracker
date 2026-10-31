import { Injectable } from '@nestjs/common';
import { todayInTimeZone } from '../common/dates/dates';
import { HabitsService } from '../habits/habits.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitsService,
    private readonly stats: StatsService,
  ) {}

  /** Everything the home screen needs, in one response. */
  async get(userId: string) {
    const { timeZone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });
    // Worked out once, so every number below uses the same day.
    const today = todayInTimeZone(timeZone);

    // Active habits only (archived ones never appear), oldest first.
    const [habits, journey] = await Promise.all([
      this.habits.findAll(userId, false, today),
      this.stats.journey(userId, today),
    ]);

    // Not done yet first, then done. sort() is stable, so each group stays oldest first.
    habits.sort((a, b) => Number(a.completedToday) - Number(b.completedToday));

    return {
      today,
      timeZone,
      completedCount: habits.filter((h) => h.completedToday).length,
      totalCount: habits.length,
      journeyDays: journey.journeyDays, // how far up the year-long hill, e.g. 12.75
      habits,
    };
  }
}
