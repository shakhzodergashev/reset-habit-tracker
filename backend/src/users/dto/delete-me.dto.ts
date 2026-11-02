import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The body of DELETE /me: the password, to confirm it's really you. */
export class DeleteMeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
