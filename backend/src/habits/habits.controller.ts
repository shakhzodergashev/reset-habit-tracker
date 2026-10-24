import {
  Body,
  Controller,
  Get,
  ParseBoolPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitsService } from './habits.service';

@Controller('habits')
@UseGuards(AuthGuard) // every habit route requires login
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  // POST /habits -> 201 Created with the new habit
  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(auth.userId, dto);
  }

  // GET /habits -> active habits; GET /habits?archived=true -> archived ones
  @Get()
  findAll(
    @CurrentAuth() auth: AuthContext,
    @Query('archived', new ParseBoolPipe({ optional: true }))
    archived?: boolean,
  ) {
    return this.habitsService.findAll(auth.userId, archived ?? false);
  }
}
