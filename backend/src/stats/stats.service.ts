import { Injectable } from '@nestjs/common';
import { fromDbDate, todayInTimeZone } from '../common/dates/dates';
import { bestStreak } from '../habits/streak';
import { PrismaService } from '../prisma/prisma.service';
import { dayStats } from './day-stats';
import { insights as buildInsights, type InsightRange } from './insights';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All-time numbers for the Insights tab, across every habit, archived ones too. */
  async get(userId: string) {
    const { today, history, activeHabits } = await this.load(userId);
    return {
      today,
      habitCount: activeHabits,
      ...dayStats(history, today),
      // The longest run of days in a row that any one habit has had.
      bestStreak: Math.max(
        0,
        ...history.map((h) => bestStreak(h.completionDates)),
      ),
    };
  }

  /** The Insights tab: streak, completion, bars and top habits for this week, month or year. */
  async insights(userId: string, range: InsightRange) {
    const { today, history } = await this.load(userId);
    return buildInsights(history, range, today);
  }

  private async load(userId: string) {
    const [user, habits] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { timeZone: true },
      }),
      // Archived habits too: their days count, except while they were put away.
      this.prisma.habit.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          emoji: true,
          startDate: true,
          isArchived: true,
          pauses: { select: { archivedOn: true, restoredOn: true } },
          completions: { select: { date: true } },
        },
      }),
    ]);

    const history = habits.map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      isArchived: h.isArchived,
      startDate: fromDbDate(h.startDate),
      pauses: h.pauses.map((p) => ({
        archivedOn: fromDbDate(p.archivedOn),
        restoredOn: p.restoredOn && fromDbDate(p.restoredOn),
      })),
      completionDates: h.completions.map((c) => fromDbDate(c.date)),
    }));
    return {
      today: todayInTimeZone(user.timeZone),
      history,
      activeHabits: habits.filter((h) => !h.isArchived).length,
    };
  }
}
