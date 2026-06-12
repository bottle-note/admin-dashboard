export interface DateRangeValidationOptions {
  startDate: string;
  endDate: string;
  today?: Date;
  startDateLabel?: string;
  endDateLabel?: string;
}

export interface DateRangeValidationIssue {
  field: 'startDate' | 'endDate';
  message: string;
}

export function validateDateRange({
  startDate,
  endDate,
  today = new Date(),
  startDateLabel = '시작일',
  endDateLabel = '종료일',
}: DateRangeValidationOptions): DateRangeValidationIssue[] {
  const issues: DateRangeValidationIssue[] = [];
  const todayValue = toDateInputValue(today);

  if (startDate && compareDateInputValues(startDate, todayValue) < 0) {
    issues.push({
      field: 'startDate',
      message: `${startDateLabel}은 오늘 이후 날짜로 입력해주세요.`,
    });
  }

  if (endDate && compareDateInputValues(endDate, todayValue) < 0) {
    issues.push({
      field: 'endDate',
      message: `${endDateLabel}은 오늘 이후 날짜로 입력해주세요.`,
    });
  }

  if (startDate && endDate && compareDateInputValues(endDate, startDate) < 0) {
    issues.push({
      field: 'endDate',
      message: `${endDateLabel}은 ${startDateLabel}보다 빠를 수 없습니다.`,
    });
  }

  return issues;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function compareDateInputValues(left: string, right: string): number {
  return left.localeCompare(right);
}
