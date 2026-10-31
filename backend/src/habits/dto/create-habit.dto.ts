import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { SINGLE_EMOJI } from '../emoji';

// Removes spaces at both ends; anything that is not text is left for the validators to reject.
export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Like trim, but empty text becomes null ("nothing").
export const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateHabitDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  // Optional: one emoji from the user's keyboard, e.g. "💧". Missing, "" or null = none.
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @Matches(SINGLE_EMOJI, { message: 'emoji must be a single emoji' })
  emoji?: string | null;
}
