import { IsIn, IsOptional, IsTimeZone } from 'class-validator';
import { CLIMBERS } from '../public-user';

// The settings a user can change. Send only the ones that change.
export class UpdateMeDto {
  // e.g. "Europe/London": decides when the user's day starts and ends.
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;

  // Who climbs the hill: "boy" or "girl".
  @IsOptional()
  @IsIn(CLIMBERS)
  climber?: (typeof CLIMBERS)[number];
}
