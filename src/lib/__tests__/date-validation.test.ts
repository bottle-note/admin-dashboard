import { describe, expect, it } from 'vitest';

import { toDateInputValue, validateDateRange } from '../date-validation';

describe('date-validation', () => {
  const today = new Date(2026, 5, 12);

  it('Date를 date input 값으로 변환한다', () => {
    expect(toDateInputValue(today)).toBe('2026-06-12');
  });

  it('시작일이나 종료일이 오늘보다 이전이면 이슈를 반환한다', () => {
    expect(
      validateDateRange({
        startDate: '2026-06-11',
        endDate: '2026-06-12',
        today,
        startDateLabel: '광고노출 시작일',
        endDateLabel: '광고노출 종료일',
      })
    ).toEqual([
      {
        field: 'startDate',
        message: '광고노출 시작일은 오늘 이후 날짜로 입력해주세요.',
      },
    ]);

    expect(
      validateDateRange({
        startDate: '2026-06-12',
        endDate: '2026-06-11',
        today,
        startDateLabel: '광고노출 시작일',
        endDateLabel: '광고노출 종료일',
      })
    ).toEqual([
      {
        field: 'endDate',
        message: '광고노출 종료일은 오늘 이후 날짜로 입력해주세요.',
      },
      {
        field: 'endDate',
        message: '광고노출 종료일은 광고노출 시작일보다 빠를 수 없습니다.',
      },
    ]);
  });

  it('종료일이 시작일보다 빠르면 이슈를 반환한다', () => {
    expect(
      validateDateRange({
        startDate: '2026-06-20',
        endDate: '2026-06-19',
        today,
        startDateLabel: '광고노출 시작일',
        endDateLabel: '광고노출 종료일',
      })
    ).toEqual([
      {
        field: 'endDate',
        message: '광고노출 종료일은 광고노출 시작일보다 빠를 수 없습니다.',
      },
    ]);
  });
});
