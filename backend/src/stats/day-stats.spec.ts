import { dayStats } from './day-stats';

const TODAY = '2026-10-31';

describe('dayStats', () => {
  it('is all zero with no habits or no completions', () => {
    const empty = { perfectDays: 0, activeDays: 0, totalCompletions: 0 };
    expect(dayStats([], TODAY)).toEqual(empty);
    expect(
      dayStats([{ startDate: '2026-10-01', completionDates: [] }], TODAY),
    ).toEqual(empty);
  });

  it('gives a perfect day when every habit is done', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: ['2026-10-30'] },
      { startDate: '2026-10-01', completionDates: ['2026-10-30'] },
    ];
    expect(dayStats(habits, TODAY)).toEqual({
      perfectDays: 1,
      activeDays: 1,
      totalCompletions: 2,
    });
  });

  it('is not perfect with 3 of 4 habits done', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [] },
    ];
    expect(dayStats(habits, TODAY)).toEqual({
      perfectDays: 0,
      activeDays: 1,
      totalCompletions: 3,
    });
  });

  it('only counts habits that existed on the day', () => {
    const habits = [
      // Alone before the 20th: done on the 10th = a perfect day.
      {
        startDate: '2026-10-01',
        completionDates: ['2026-10-10', '2026-10-25'],
      },
      // Started on the 20th and never done, so the 25th isn't perfect.
      { startDate: '2026-10-20', completionDates: [] },
    ];
    expect(dayStats(habits, TODAY)).toMatchObject({
      perfectDays: 1,
      activeDays: 2,
    });
  });

  it('counts an archived habit up to the day it was archived, not after', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: ['2026-10-10', TODAY] },
      {
        startDate: '2026-10-01',
        pauses: [{ archivedOn: '2026-10-20', restoredOn: null }],
        completionDates: ['2026-10-10', '2026-10-20'],
      },
    ];
    // 10th: both done = perfect. 20th (archive day): 1 of 2.
    // 31st: only the first habit still counts, and it was done = perfect.
    expect(dayStats(habits, TODAY)).toMatchObject({
      perfectDays: 2,
      totalCompletions: 4,
    });
  });

  it('leaves a habit out only between the day archived and the day restored', () => {
    const habits = [
      {
        startDate: '2026-10-01',
        completionDates: ['2026-10-20', '2026-10-22', '2026-10-25'],
      },
      {
        startDate: '2026-10-01',
        pauses: [{ archivedOn: '2026-10-20', restoredOn: '2026-10-25' }],
        completionDates: [],
      },
    ];
    // 20th (archived that day) and 25th (restored that day): 1 of 2.
    // 22nd (put away): only the first habit counts, and it was done = perfect.
    expect(dayStats(habits, TODAY)).toMatchObject({
      perfectDays: 1,
      activeDays: 3,
    });
  });

  it('counts a tick on a paused day, with the habit taking part that day', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: ['2026-10-22'] },
      {
        startDate: '2026-10-01',
        pauses: [{ archivedOn: '2026-10-20', restoredOn: '2026-10-25' }],
        completionDates: ['2026-10-22'], // ticked later in the calendar
      },
    ];
    expect(dayStats(habits, TODAY)).toMatchObject({
      perfectDays: 1,
      totalCompletions: 2,
    });
  });

  it('ignores days after today and before the habit started', () => {
    const habits = [
      {
        startDate: '2026-10-10',
        completionDates: ['2026-10-05', '2026-11-01'],
      },
    ];
    expect(dayStats(habits, TODAY).activeDays).toBe(0);
  });
});
