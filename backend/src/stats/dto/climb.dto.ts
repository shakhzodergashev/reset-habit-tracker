import { IsIn } from 'class-validator';
import { CLIMB_LENGTHS, type ClimbLength } from '../journey';

/** The body of POST /climbs and PATCH /climbs/current. */
export class ClimbDto {
  @IsIn(CLIMB_LENGTHS, {
    message: `goalDays must be one of: ${CLIMB_LENGTHS.join(', ')}`,
  })
  goalDays!: ClimbLength;
}
