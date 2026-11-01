import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fromDbDate, toDbDate, todayInTimeZone } from '../common/dates/dates';
import { PrismaService } from '../prisma/prisma.service';
import { insights as buildInsights, type InsightRange } from './insights';
import { journeyStats, type ClimbLength } from './journey';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Everything the Stats tab needs: all-time numbers, the current climb
   * (null until the user has chosen one) and how many climbs are complete.
   */
  async get(userId: string) {
    const { today, history, activeHabits, climb, finishedClimbs } =
      await this.load(userId);
    const allTime = journeyStats(history, today);

    const current = climb && {
      goalDays: climb.goalDays,
      startDate: fromDbDate(climb.startDate),
      // Only the days since this climb started move the cyclist up this hill.
      journeyDays: journeyStats(history, today, fromDbDate(climb.startDate))
        .journeyDays,
    };
    const isComplete = !!current && current.journeyDays >= current.goalDays;

    return {
      today,
      habitCount: activeHabits,
      ...allTime,
      climb: current && { ...current, isComplete },
      climbsCompleted: finishedClimbs + (isComplete ? 1 : 0),
    };
  }

  /**
   * Starts a climb. The very first one starts on the day the account was made,
   * so nothing done before choosing is lost. After that, a new climb can only
   * start once the current one is complete; it starts today.
   */
  async startClimb(userId: string, goalDays: ClimbLength) {
    const { today, user, climb } = await this.load(userId);

    if (!climb) {
      await this.prisma.climb.create({
        data: {
          userId,
          goalDays,
          startDate: toDbDate(todayInTimeZone(user.timeZone, user.createdAt)),
        },
      });
      return this.get(userId);
    }

    const stats = await this.get(userId);
    if (!stats.climb?.isComplete) {
      throw new ConflictException(
        'Finish your current climb first, or change its length.',
      );
    }
    // Close the finished climb and start the next one, together.
    await this.prisma.$transaction([
      this.prisma.climb.update({
        where: { id: climb.id },
        data: { finishedOn: toDbDate(today) },
      }),
      this.prisma.climb.create({
        data: { userId, goalDays, startDate: toDbDate(today) },
      }),
    ]);
    return this.get(userId);
  }

  /** Changes how long the current climb is. The days already climbed still count. */
  async changeClimbLength(userId: string, goalDays: ClimbLength) {
    const { climb } = await this.load(userId);
    if (!climb) {
      throw new NotFoundException('No climb yet. Choose one first.');
    }
    await this.prisma.climb.update({
      where: { id: climb.id },
      data: { goalDays },
    });
    return this.get(userId);
  }

  /** The Insights tab: streak, completion, bars and top habits for this week, month or year. */
  async insights(userId: string, range: InsightRange) {
    const { today, history } = await this.load(userId);
    return buildInsights(history, range, today);
  }

  private async load(userId: string) {
    const [user, habits, climb, finishedClimbs] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { timeZone: true, createdAt: true },
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
      // The current climb: the newest one that is not finished.
      this.prisma.climb.findFirst({
        where: { userId, finishedOn: null },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.climb.count({
        where: { userId, finishedOn: { not: null } },
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
      user,
      history,
      activeHabits: habits.filter((h) => !h.isArchived).length,
      climb,
      finishedClimbs,
    };
  }
}
