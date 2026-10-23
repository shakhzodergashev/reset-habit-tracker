import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  // Trim spaces and lowercase, so "  Ali@Mail.com " and "ali@mail.com" are the same account.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // bcrypt only uses the first 72 bytes of a password, so longer ones are rejected.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  // Sent by the browser, e.g. "Asia/Tashkent". If missing, the database default "UTC" is used.
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;
}
