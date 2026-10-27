import { Injectable, NotFoundException } from '@nestjs/common';
import { fromDbDate, toDbDate, todayInTimeZone } from '../common/dates/dates';
import { Habit } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { currentStreak } from './streak';

// Tells Prisma to load each habit's completed days in the same query.
const WITH_COMPLETION_DATES = {
  completions: { select: { date: true } },
} as const;

type HabitWithDates = Habit & { completions: { date: Date }[] };

/**
 * The shape of a habit sent to the client: no userId, dates as "YYYY-MM-DD",
 * plus the streak and whether it is done, both based on the user's `today`.
 */
export function toHabitResponse(habit: HabitWithDates, today: string) {
  const days = habit.completions.map((c) => fromDbDate(c.date));
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    startDate: fromDbDate(habit.startDate),
    isArchived: habit.isArchived,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
    currentStreak: currentStreak(days, today),
    completedToday: days.includes(today),
  };
}

export type HabitResponse = ReturnType<typeof toHabitResponse>;

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateHabitDto) {
    // The habit starts "today" in the user's own time zone.
    const today = await this.todayFor(userId);

    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        startDate: toDbDate(today),
      },
      include: WITH_COMPLETION_DATES,
    });
    return toHabitResponse(habit, today);
  }

  /**
   * The user's habits, oldest first. `today` can be passed in by callers that
   * already know it (the dashboard), so every number uses the same day.
   */
  async findAll(userId: string, archived: boolean, today?: string) {
    today ??= await this.todayFor(userId);
    const habits = await this.prisma.habit.findMany({
      // userId in the filter = only this user's habits, never anyone else's.
      where: { userId, isArchived: archived },
      orderBy: { createdAt: 'asc' },
      include: WITH_COMPLETION_DATES,
    });
    return habits.map((habit) => toHabitResponse(habit, today));
  }

  async findOne(userId: string, habitId: string) {
    await this.findOwnedHabit(userId, habitId);
    const [today, habit] = await Promise.all([
      this.todayFor(userId),
      this.prisma.habit.findUniqueOrThrow({
        where: { id: habitId },
        include: WITH_COMPLETION_DATES,
      }),
    ]);
    return toHabitResponse(habit, today);
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.findOwnedHabit(userId, habitId);

    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      // Fields left undefined are not changed.
      data: { name: dto.name, description: dto.description, color: dto.color },
      include: WITH_COMPLETION_DATES,
    });
    return toHabitResponse(habit, await this.todayFor(userId));
  }

  /** Hides the habit from the active list. Its history is kept. */
  archive(userId: string, habitId: string) {
    return this.setArchived(userId, habitId, true);
  }

  /** Puts an archived habit back in the active list, with its history. */
  restore(userId: string, habitId: string) {
    return this.setArchived(userId, habitId, false);
  }

  private async setArchived(
    userId: string,
    habitId: string,
    isArchived: boolean,
  ) {
    await this.findOwnedHabit(userId, habitId);

    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: { isArchived },
      include: WITH_COMPLETION_DATES,
    });
    return toHabitResponse(habit, await this.todayFor(userId));
  }

  /**
   * Finds a habit only if it belongs to this user.
   * Someone else's habit gets the same 404 as a missing one,
   * so nobody can learn which habit ids exist.
   * Public so other modules (completions) use the same ownership check.
   */
  async findOwnedHabit(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  /** Today's date ("YYYY-MM-DD") in the user's own time zone. */
  async todayFor(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });
    return todayInTimeZone(user.timeZone);
  }
}
