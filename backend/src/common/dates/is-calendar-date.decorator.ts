import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidDateString } from './dates';

/** DTO rule: the value must be a real calendar date written as "YYYY-MM-DD". */
export function IsCalendarDate(options?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'isCalendarDate',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a real calendar date written as YYYY-MM-DD`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidDateString(value),
      },
    });
  };
}
