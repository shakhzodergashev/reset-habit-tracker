import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // Same clean-up as registration, so the email matches what was stored.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // No length rules beyond the bcrypt limit: login only checks the password matches.
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
