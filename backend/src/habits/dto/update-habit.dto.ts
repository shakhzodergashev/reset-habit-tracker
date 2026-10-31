import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { SINGLE_EMOJI } from '../emoji';
import { trim, trimToNull } from './create-habit.dto';

/** Every field is optional: only the fields that are sent get changed. */
export class UpdateHabitDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  // Send null or "" to remove the description.
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  // Send null or "" to remove the emoji.
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @Matches(SINGLE_EMOJI, { message: 'emoji must be a single emoji' })
  emoji?: string | null;
}
