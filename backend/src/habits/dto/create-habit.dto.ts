import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Removes spaces at both ends; anything that is not text is left for the validators to reject.
export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Like trim, but an empty description becomes null ("no description").
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

  // A hex color such as "#22AA88". Stored in upper case so the same color always looks the same.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @Matches(/^#[0-9A-F]{6}$/, { message: 'color must look like #22AA88' })
  color!: string;
}
