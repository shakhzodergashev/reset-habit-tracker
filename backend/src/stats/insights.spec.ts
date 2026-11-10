import { insights, rangeDates, type InsightHabit } from './insights';

const TODAY = '2026-10-29'; // a Thursday

function habit(
  name: string,
  completionDates: string[],
  extra: Partial<InsightHabit> = {},
): InsightHabit {
  return {
    id: name,
    name,
    emoji: null,
    isArchived: false,
    startDate: '2026-01-01',
    completionDates,
    ...extra,
  };
}

describe('rangeDates', () => {
  it('finds this week (Monday to Sunday), month and year', () => {
    expect(rangeDates('week', TODAY)).toEqual({
      from: '2026-10-26',
      to: '2026-11-01',
    });
    expect(rangeDates('month', TODAY)).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(rangeDates('month', '2026-02-10').to).toBe('2026-02-28');
    expect(rangeDates('year', TODAY)).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
});

describe('insights', () => {
  it('works out the week: rate, bars, top habits', () => {
    const habits = [
      habit('Water', ['2026-10-26', '2026-10-27', '2026-10-28', TODAY]),
      habit('Read', ['2026-10-26', TODAY]),
    ];
    const week = insights(habits, 'week', TODAY);

    // 4 days so far x 2 habits = 8 possible, 6 done.
    expect(week.completionRate).toBe(75);
    expect(week.bars.map((b) => b.rate)).toEqual([
      100,
      50,
      50,
      100,
      null, // Friday is still to come
      null,
      null,
    ]);
    expect(week.bars[0].label).toBe('Mon');
    expect(week.topHabits).toEqual([
      expect.objectContaining({
        name: 'Water',
        doneDays: 4,
        possibleDays: 4,
        rate: 100,
      }),
      expect.objectContaining({
        name: 'Read',
        doneDays: 2,
        possibleDays: 4,
        rate: 50,
      }),
    ]);
  });

  it('counts the day streak, with today not done yet not breaking it', () => {
    const habits = [habit('Water', ['2026-10-26', '2026-10-27', '2026-10-28'])];
    expect(insights(habits, 'week', TODAY).dayStreak).toBe(3);
    expect(
      insights([habit('Water', ['2026-10-26'])], 'week', TODAY).dayStreak,
    ).toBe(0);
  });

  it('gives one bar per month for the year, empty for months still to come', () => {
    const year = insights([habit('Water', [TODAY])], 'year', TODAY);
    expect(year.bars).toHaveLength(12);
    expect(year.bars[0]).toEqual({ label: 'Jan', rate: 0 });
    expect(year.bars[11]).toEqual({ label: 'Dec', rate: null });
  });

  it('leaves out habits before they start and while put away', () => {
    const habits = [
      habit('New', [TODAY], { startDate: TODAY }),
      habit('Away', [], {
        isArchived: true,
        pauses: [{ archivedOn: '2026-10-20', restoredOn: null }],
      }),
    ];
    const week = insights(habits, 'week', TODAY);
    expect(week.completionRate).toBe(100); // only "New", on its one day
    expect(week.topHabits.map((h) => h.name)).toEqual(['New']); // archived ones are not listed
  });

  it('has nothing to show with no habits', () => {
    const week = insights([], 'week', TODAY);
    expect(week.completionRate).toBeNull();
    expect(week.dayStreak).toBe(0);
    expect(week.topHabits).toEqual([]);
  });

  it('shows an earlier week, with its own best streak', () => {
    // The week before TODAY's: Mon 19 to Sun 25 October.
    const habits = [
      habit('Water', ['2026-10-19', '2026-10-20', '2026-10-22', TODAY]),
    ];
    const week = insights(habits, 'week', TODAY, '2026-10-21');
    expect(week).toMatchObject({
      from: '2026-10-19',
      to: '2026-10-25',
      isCurrent: false,
      hasEarlier: true, // the habit started back in January
      bestStreak: 2, // Mon and Tue
      dayStreak: 1, // still today's streak
    });
    expect(week.bars.map((b) => b.rate)).toEqual([100, 100, 0, 100, 0, 0, 0]);
  });

  it('knows when there is nothing earlier to step back to', () => {
    const habits = [habit('New', [TODAY], { startDate: '2026-10-27' })];
    expect(insights(habits, 'week', TODAY)).toMatchObject({
      isCurrent: true,
      hasEarlier: false,
    });
    expect(insights(habits, 'year', TODAY).hasEarlier).toBe(false);
  });

  it('compares with the period before, to show up or down', () => {
    // Last week (19-25 Oct): done every day = 100%. This week so far
    // (Mon 26 to Thu 29): 2 of 4 days = 50%.
    const last = ['19', '20', '21', '22', '23', '24', '25'];
    const habits = [
      habit('Water', [...last.map((d) => `2026-10-${d}`), '2026-10-26', TODAY]),
    ];
    expect(insights(habits, 'week', TODAY)).toMatchObject({
      completionRate: 50,
      previousRate: 100,
    });
    // Before the habit started there is nothing to compare with.
    const fresh = [habit('New', [TODAY], { startDate: '2026-10-27' })];
    expect(insights(fresh, 'week', TODAY).previousRate).toBeNull();
  });
});
