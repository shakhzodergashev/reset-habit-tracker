import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthContext } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { ParseDatePipe } from '../common/dates/parse-date.pipe';
import { CompletionsService } from './completions.service';

@Controller('habits/:habitId/completions')
@UseGuards(AuthGuard) // every completion route requires login
export class CompletionsController {
  constructor(private readonly completionsService: CompletionsService) {}

  // PUT /habits/:habitId/completions/2026-10-26 -> 200 { habitId, date }
  // PUT = "make sure this day is marked", so repeating it changes nothing.
  @Put(':date')
  mark(
    @CurrentAuth() auth: AuthContext,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Param('date', ParseDatePipe) date: string,
  ) {
    return this.completionsService.mark(auth.userId, habitId, date);
  }

  // DELETE /habits/:habitId/completions/2026-10-26 -> 204 No Content
  @Delete(':date')
  @HttpCode(HttpStatus.NO_CONTENT)
  unmark(
    @CurrentAuth() auth: AuthContext,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Param('date', ParseDatePipe) date: string,
  ) {
    return this.completionsService.unmark(auth.userId, habitId, date);
  }
}
