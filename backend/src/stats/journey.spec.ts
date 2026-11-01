import { journeyStats } from './journey';

const TODAY = '2026-10-31';

describe('journeyStats', () => {
  it('is all zero with no habits or no completions', () => {
    const empty = {
      journeyDays: 0,
      perfectDays: 0,
      activeDays: 0,
      totalCompletions: 0,
    };
    expect(journeyStats([], TODAY)).toEqual(empty);
    expect(
      journeyStats([{ startDate: '2026-10-01', completionDates: [] }], TODAY),
    ).toEqual(empty);
  });

  it('gives a full day when every habit is done', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: ['2026-10-30'] },
      { startDate: '2026-10-01', completionDates: ['2026-10-30'] },
    ];
    expect(journeyStats(habits, TODAY)).toMatchObject({
      journeyDays: 1,
      perfectDays: 1,
    });
  });

  it('gives 3/4 of a day for 3 of 4 habits', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [TODAY] },
      { startDate: '2026-10-01', completionDates: [] },
    ];
    expect(journeyStats(habits, TODAY)).toEqual({
      journeyDays: 0.75,
      perfectDays: 0,
      activeDays: 1,
      totalCompletions: 3,
    });
  });

  it('only shares a day between habits that existed on it', () => {
    const habits = [
      // Alone before the 20th: each completion is a full day.
      {
        startDate: '2026-10-01',
        completionDates: ['2026-10-10', '2026-10-25'],
      },
      // Started on the 20th: from then on, each habit is half a day.
      { startDate: '2026-10-20', completionDates: [] },
    ];
    expect(journeyStats(habits, TODAY)).toMatchObject({
      journeyDays: 1.5,
      perfectDays: 1,
      activeDays: 2,
    });
  });

  it('adds thirds up to whole days (two decimals)', () => {
    const habits = [1, 2, 3].map(() => ({
      startDate: '2026-10-01',
      completionDates: ['2026-10-28', '2026-10-29'],
    }));
    expect(journeyStats(habits, TODAY).journeyDays).toBe(2);

    habits[0].completionDates.push('2026-10-30'); // 1 of 3
    expect(journeyStats(habits, TODAY).journeyDays).toBe(2.33);
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
    // 10th: both done = a full day. 20th (archive day): 1 of 2 = half a day.
    // 31st: only the first habit still counts, and it was done = a full day.
    expect(journeyStats(habits, TODAY)).toMatchObject({
      journeyDays: 2.5,
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
    // 20th (archived that day) and 25th (restored that day): 1 of 2 = half a day each.
    // 22nd (put away): only the first habit counts = a full day.
    expect(journeyStats(habits, TODAY).journeyDays).toBe(2);
  });

  it('counts a tick on a paused day, with the habit taking part that day', () => {
    const habits = [
      { startDate: '2026-10-01', completionDates: ['2026-10-22'] },
      {
        startDate: '2026-10-01',
        pauses: [{ archivedOn: '2026-10-20', restoredOn: '2026-10-25' }],
        completionDates: ['2026-10-22'], // ticked later in the 14-day grid
      },
    ];
    expect(journeyStats(habits, TODAY)).toMatchObject({
      journeyDays: 1,
      totalCompletions: 2,
    });
  });

  it('counts only from the day a climb started, when given', () => {
    const habits = [
      {
        startDate: '2026-10-01',
        completionDates: ['2026-10-10', '2026-10-20', '2026-10-21'],
      },
    ];
    expect(journeyStats(habits, TODAY).journeyDays).toBe(3);
    expect(journeyStats(habits, TODAY, '2026-10-20').journeyDays).toBe(2);
    expect(journeyStats(habits, TODAY, '2026-10-22').journeyDays).toBe(0);
  });

  it('ignores days after today and before the habit started', () => {
    const habits = [
      {
        startDate: '2026-10-10',
        completionDates: ['2026-10-05', '2026-11-01'],
      },
    ];
    expect(journeyStats(habits, TODAY).journeyDays).toBe(0);
  });
});
