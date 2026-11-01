import { BadRequestException, Injectable } from '@nestjs/common';
import { toDbDate, todayInTimeZone } from '../common/dates/dates';
import { HabitsService } from '../habits/habits.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitsService,
  ) {}

  /**
   * Everything the home screen needs for one day (today, or a past day picked
   * in the week strip), in one response.
   */
  async get(userId: string, date?: string) {
    const { timeZone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });
    // Worked out once, so every number below uses the same day.
    const today = todayInTimeZone(timeZone);
    const day = date ?? today;
    if (day > today) {
      throw new BadRequestException('date cannot be in the future');
    }

    // Active habits that had already started on that day, oldest first.
    const [habits, doneThatDay] = await Promise.all([
      this.habits.findAll(userId, false, today),
      this.prisma.habitCompletion.findMany({
        where: { date: toDbDate(day), habit: { userId } },
        select: { habitId: true },
      }),
    ]);
    const doneIds = new Set(doneThatDay.map((c) => c.habitId));
    const list = habits
      .filter((h) => h.startDate <= day)
      .map((h) => ({ ...h, completedOnDate: doneIds.has(h.id) }));

    // Not done yet first, then done. sort() is stable, so each group stays oldest first.
    list.sort((a, b) => Number(a.completedOnDate) - Number(b.completedOnDate));

    return {
      today,
      date: day,
      timeZone,
      completedCount: list.filter((h) => h.completedOnDate).length,
      totalCount: list.length,
      habits: list,
    };
  }
}
