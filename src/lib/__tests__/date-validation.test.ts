import { describe, expect, it } from 'vitest';

import { compareDateInputValues, toDateInputValue } from '../date-validation';

describe('date-validation', () => {
  const today = new Date(2026, 5, 12);

  it('Date를 date input 값으로 변환한다', () => {
    expect(toDateInputValue(today)).toBe('2026-06-12');
  });

  it('date input 값을 문자열 기준으로 비교한다', () => {
    expect(compareDateInputValues('2026-06-11', '2026-06-12')).toBeLessThan(0);
    expect(compareDateInputValues('2026-06-12', '2026-06-12')).toBe(0);
    expect(compareDateInputValues('2026-06-13', '2026-06-12')).toBeGreaterThan(0);
  });
});
