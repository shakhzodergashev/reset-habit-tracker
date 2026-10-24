import { Injectable, NotFoundException } from '@nestjs/common';
import { fromDbDate, toDbDate, todayInTimeZone } from '../common/dates/dates';
import { Habit } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

/** The shape of a habit sent to the client: no userId, dates as "YYYY-MM-DD". */
function toHabitResponse(habit: Habit) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    startDate: fromDbDate(habit.startDate),
    isArchived: habit.isArchived,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
  };
}

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateHabitDto) {
    // The habit starts "today" in the user's own time zone.
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });

    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        startDate: toDbDate(todayInTimeZone(user.timeZone)),
      },
    });
    return toHabitResponse(habit);
  }

  async findAll(userId: string, archived: boolean) {
    const habits = await this.prisma.habit.findMany({
      // userId in the filter = only this user's habits, never anyone else's.
      where: { userId, isArchived: archived },
      orderBy: { createdAt: 'asc' },
    });
    return habits.map(toHabitResponse);
  }

  async findOne(userId: string, habitId: string) {
    return toHabitResponse(await this.findOwnedHabit(userId, habitId));
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.findOwnedHabit(userId, habitId);

    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      // Fields left undefined are not changed.
      data: { name: dto.name, description: dto.description, color: dto.color },
    });
    return toHabitResponse(habit);
  }

  /**
   * Finds a habit only if it belongs to this user.
   * Someone else's habit gets the same 404 as a missing one,
   * so nobody can learn which habit ids exist.
   */
  private async findOwnedHabit(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }
}
