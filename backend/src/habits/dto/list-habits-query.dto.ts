import { IsIn, IsOptional } from 'class-validator';

/** Query string for GET /habits, e.g. ?archived=true */
export class ListHabitsQueryDto {
  // Kept as text on purpose: anything other than "true" or "false" is rejected.
  @IsOptional()
  @IsIn(['true', 'false'])
  archived?: 'true' | 'false';
}
