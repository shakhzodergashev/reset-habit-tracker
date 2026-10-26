import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidDateString } from './dates';

/** Accepts only real calendar dates written as "YYYY-MM-DD", e.g. in a URL like /completions/2026-10-26. */
@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidDateString(value)) {
      throw new BadRequestException(
        'date must be a real calendar date written as YYYY-MM-DD',
      );
    }
    return value;
  }
}
