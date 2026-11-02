import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { CreateHabitDto } from './dto/create-habit.dto';
import { ListHabitsQueryDto } from './dto/list-habits-query.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
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
    @Query() query: ListHabitsQueryDto,
  ) {
    return this.habitsService.findAll(auth.userId, query.archived === 'true');
  }

  // GET /habits/:id -> one of the user's own habits (404 otherwise)
  @Get(':id')
  findOne(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitsService.findOne(auth.userId, id);
  }

  // PATCH /habits/:id -> change name, description and/or emoji
  @Patch(':id')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(auth.userId, id, dto);
  }

  // DELETE /habits/:id -> 204, the habit and its history are gone for good
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitsService.remove(auth.userId, id);
  }

  // POST /habits/:id/archive -> 200 with the habit, now archived
  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitsService.archive(auth.userId, id);
  }

  // POST /habits/:id/restore -> 200 with the habit, active again
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(
    @CurrentAuth() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitsService.restore(auth.userId, id);
  }
}
