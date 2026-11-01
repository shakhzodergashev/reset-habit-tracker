import { IsOptional } from 'class-validator';
import { IsCalendarDate } from '../common/dates/is-calendar-date.decorator';

/** Query string for GET /dashboard, e.g. ?date=2026-10-28. Missing = today. */
export class DashboardQueryDto {
  @IsOptional()
  @IsCalendarDate()
  date?: string;
}
