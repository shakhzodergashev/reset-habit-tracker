import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { fromDbDate, toDbDate } from '../common/dates/dates';
import { Habit, Prisma } from '../generated/prisma/client';
import { HabitsService } from '../habits/habits.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompletionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitsService,
  ) {}

  /**
   * The days this habit was done, oldest first, as "YYYY-MM-DD" text.
   * Works for archived habits too: archiving blocks changes, not reading.
   */
  async list(
    userId: string,
    habitId: string,
    range: { from?: string; to?: string },
  ) {
    await this.habits.findOwnedHabit(userId, habitId);

    if (range.from && range.to && range.from > range.to) {
      throw new BadRequestException('from must be on or before to');
    }

    const rows = await this.prisma.habitCompletion.findMany({
      where: {
        habitId,
        // undefined = no limit on that side
        date: {
          gte: range.from ? toDbDate(range.from) : undefined,
          lte: range.to ? toDbDate(range.to) : undefined,
        },
      },
      orderBy: { date: 'asc' },
      select: { date: true },
    });
    return rows.map((row) => fromDbDate(row.date));
  }

  /** Marks the habit as done on `date`. Doing it twice is harmless. */
  async mark(userId: string, habitId: string, date: string) {
    const habit = await this.findChangeableHabit(userId, habitId);

    // "YYYY-MM-DD" text sorts like a date, so plain < and > comparisons work.
    const today = await this.habits.todayFor(userId);
    if (date > today) {
      throw new BadRequestException('date cannot be in the future');
    }
    const startDate = fromDbDate(habit.startDate);
    if (date < startDate) {
      throw new BadRequestException(
        `date cannot be before the habit started (${startDate})`,
      );
    }

    try {
      await this.prisma.habitCompletion.create({
        data: { habitId, date: toDbDate(date) },
      });
    } catch (error) {
      // P2002 = already marked for this day (the unique habitId + date rule). That is fine.
      const alreadyDone =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (!alreadyDone) {
        throw error;
      }
    }
    return { habitId, date };
  }

  /** Removes the mark for `date`. Undoing a day that was not marked is harmless. */
  async unmark(userId: string, habitId: string, date: string): Promise<void> {
    await this.findChangeableHabit(userId, habitId);

    await this.prisma.habitCompletion.deleteMany({
      where: { habitId, date: toDbDate(date) },
    });
  }

  /** The user's own habit, and only while it is not archived (approved decision 4). */
  private async findChangeableHabit(
    userId: string,
    habitId: string,
  ): Promise<Habit> {
    const habit = await this.habits.findOwnedHabit(userId, habitId);
    if (habit.isArchived) {
      throw new ConflictException(
        'This habit is archived. Restore it before changing its completions.',
      );
    }
    return habit;
  }
}
