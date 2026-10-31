import { Injectable } from '@nestjs/common';
import { fromDbDate, todayInTimeZone } from '../common/dates/dates';
import { PrismaService } from '../prisma/prisma.service';
import { journeyStats, YEAR_DAYS } from './journey';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the stats page needs, in one response. */
  async get(userId: string) {
    const { timeZone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });
    const today = todayInTimeZone(timeZone);
    const { habitCount, stats } = await this.load(userId, today);

    return { today, yearDays: YEAR_DAYS, habitCount, ...stats };
  }

  /** The journey numbers for one user. The dashboard passes in the `today` it already has. */
  async journey(userId: string, today: string) {
    return (await this.load(userId, today)).stats;
  }

  private async load(userId: string, today: string) {
    // Active habits only: an archived habit no longer shares in anyone's days.
    const habits = await this.prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { startDate: true, completions: { select: { date: true } } },
    });
    const history = habits.map((h) => ({
      startDate: fromDbDate(h.startDate),
      completionDates: h.completions.map((c) => fromDbDate(c.date)),
    }));
    return { habitCount: habits.length, stats: journeyStats(history, today) };
  }
}
