import { bestStreak, currentStreak } from './streak';

describe('bestStreak', () => {
  it('is 0 with no days and 1 for a single day', () => {
    expect(bestStreak([])).toBe(0);
    expect(bestStreak(['2026-10-01'])).toBe(1);
  });

  it('finds the longest run, in any order, across month ends', () => {
    const days = [
      '2026-10-20',
      '2026-09-29',
      '2026-10-21',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02', // 29 Sep -> 2 Oct: 4 days
      '2026-10-22',
    ];
    expect(bestStreak(days)).toBe(4);
  });
});

const TODAY = '2026-10-26';

describe('currentStreak', () => {
  it('is 0 with no completions', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('is 1 when only today is done', () => {
    expect(currentStreak(['2026-10-26'], TODAY)).toBe(1);
  });

  it('stays alive when today is not done yet', () => {
    // Done yesterday, not yet today: still a streak of 1 until today ends.
    expect(currentStreak(['2026-10-25'], TODAY)).toBe(1);
    expect(
      currentStreak(['2026-10-23', '2026-10-24', '2026-10-25'], TODAY),
    ).toBe(3);
  });

  it('counts consecutive days ending today', () => {
    expect(
      currentStreak(['2026-10-24', '2026-10-25', '2026-10-26'], TODAY),
    ).toBe(3);
  });

  it('breaks after a missed day', () => {
    // Yesterday was missed, so the old run no longer counts.
    expect(currentStreak(['2026-10-23', '2026-10-24'], TODAY)).toBe(0);
  });

  it('starts again at 1 after a gap', () => {
    // 25 Oct was missed; today starts a new streak.
    expect(
      currentStreak(
        ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-26'],
        TODAY,
      ),
    ).toBe(1);
  });

  it('does not care about order or duplicates', () => {
    expect(
      currentStreak(
        ['2026-10-26', '2026-10-24', '2026-10-25', '2026-10-25'],
        TODAY,
      ),
    ).toBe(3);
  });

  it('ignores future dates', () => {
    expect(currentStreak(['2026-10-27', '2026-10-26'], TODAY)).toBe(1);
    expect(currentStreak(['2026-10-27'], TODAY)).toBe(0);
  });

  it('reconnects when a forgotten day is filled in later', () => {
    const days = ['2026-10-24', '2026-10-26'];
    expect(currentStreak(days, TODAY)).toBe(1);

    days.push('2026-10-25'); // the user marks the day they forgot
    expect(currentStreak(days, TODAY)).toBe(3);
  });

  it('splits when a day in the middle is undone', () => {
    const days = ['2026-10-24', '2026-10-25', '2026-10-26'];
    expect(currentStreak(days, TODAY)).toBe(3);

    const withoutMiddle = days.filter((d) => d !== '2026-10-25');
    expect(currentStreak(withoutMiddle, TODAY)).toBe(1);
  });

  it('crosses month, year and leap-day boundaries', () => {
    expect(
      currentStreak(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01'),
    ).toBe(3);
    expect(
      currentStreak(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01'),
    ).toBe(3);
    // 2026 has no 29 February, so 28 Feb and 1 Mar are neighbours.
    expect(currentStreak(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
  });
});
