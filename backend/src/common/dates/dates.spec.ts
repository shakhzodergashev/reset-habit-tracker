import {
  addDays,
  fromDbDate,
  isValidDateString,
  isValidTimeZone,
  toDbDate,
  todayInTimeZone,
} from './dates';

describe('isValidTimeZone', () => {
  it('accepts real time zones', () => {
    expect(isValidTimeZone('Asia/Tashkent')).toBe(true);
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
  });

  it('rejects made-up or empty values', () => {
    expect(isValidTimeZone('Mars/Phobos')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('todayInTimeZone', () => {
  it('gives different dates for the same moment in different places', () => {
    // 21 Oct 2026, 21:00 UTC
    const moment = new Date('2026-10-21T21:00:00Z');

    expect(todayInTimeZone('UTC', moment)).toBe('2026-10-21');
    expect(todayInTimeZone('Europe/London', moment)).toBe('2026-10-21'); // 22:00
    expect(todayInTimeZone('America/New_York', moment)).toBe('2026-10-21'); // 17:00
    expect(todayInTimeZone('Asia/Tashkent', moment)).toBe('2026-10-22'); // 02:00 next day
  });

  it('switches to the next date exactly at local midnight', () => {
    // Tashkent is UTC+5, so local midnight is 19:00 UTC.
    const oneSecondBefore = new Date('2026-10-21T18:59:59Z');
    const exactlyMidnight = new Date('2026-10-21T19:00:00Z');

    expect(todayInTimeZone('Asia/Tashkent', oneSecondBefore)).toBe(
      '2026-10-21',
    );
    expect(todayInTimeZone('Asia/Tashkent', exactlyMidnight)).toBe(
      '2026-10-22',
    );
  });

  it('handles places far from UTC', () => {
    // 21 Oct 2026, 11:30 UTC
    const moment = new Date('2026-10-21T11:30:00Z');

    expect(todayInTimeZone('Pacific/Kiritimati', moment)).toBe('2026-10-22'); // UTC+14
    expect(todayInTimeZone('Pacific/Pago_Pago', moment)).toBe('2026-10-21'); // UTC-11
  });
});

describe('isValidDateString', () => {
  it('accepts real dates', () => {
    expect(isValidDateString('2026-10-21')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true); // 2024 is a leap year
  });

  it('rejects dates that do not exist', () => {
    expect(isValidDateString('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidDateString('2026-13-01')).toBe(false); // no 13th month
    expect(isValidDateString('2026-10-00')).toBe(false);
  });

  it('rejects the wrong shape', () => {
    expect(isValidDateString('21-10-2026')).toBe(false);
    expect(isValidDateString('2026-1-5')).toBe(false);
    expect(isValidDateString('2026-10-21T10:00')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});

describe('addDays', () => {
  it('moves forward and back by one day', () => {
    expect(addDays('2026-10-21', 1)).toBe('2026-10-22');
    expect(addDays('2026-10-21', -1)).toBe('2026-10-20');
    expect(addDays('2026-10-21', 0)).toBe('2026-10-21');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('knows about leap years', () => {
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29'); // leap year
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28'); // normal year
  });

  it('is not affected by daylight-saving changes', () => {
    // New York and London change their clocks on these dates in 2026.
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28');
  });
});

describe('toDbDate and fromDbDate', () => {
  it('converts text to a Date at UTC midnight', () => {
    expect(toDbDate('2026-10-21').toISOString()).toBe(
      '2026-10-21T00:00:00.000Z',
    );
  });

  it('converts a Date from the database back to text', () => {
    expect(fromDbDate(new Date('2026-10-21T00:00:00Z'))).toBe('2026-10-21');
  });

  it('round-trips without shifting the date', () => {
    for (const date of [
      '2026-01-01',
      '2026-10-21',
      '2024-02-29',
      '2026-12-31',
    ]) {
      expect(fromDbDate(toDbDate(date))).toBe(date);
    }
  });
});
