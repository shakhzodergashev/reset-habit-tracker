import { IsTimeZone } from 'class-validator';

export class UpdateMeDto {
  // The only setting a user can change for now, e.g. "Europe/London".
  @IsTimeZone()
  timeZone!: string;
}
