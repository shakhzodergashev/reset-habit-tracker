import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** The body of PATCH /me/password. */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string;

  // The same rules as when registering. bcrypt only uses the first 72 bytes.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
