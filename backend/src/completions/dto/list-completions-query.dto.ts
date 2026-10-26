import { IsOptional } from 'class-validator';
import { IsCalendarDate } from '../../common/dates/is-calendar-date.decorator';

/** Query string for GET /habits/:habitId/completions, e.g. ?from=2026-10-01&to=2026-10-31 */
export class ListCompletionsQueryDto {
  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;
}
