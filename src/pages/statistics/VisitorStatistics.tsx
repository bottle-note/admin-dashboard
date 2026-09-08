/**
 * 방문자 통계 조회 페이지
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
import {
  useActiveVisitorStatistics,
  useVisitorRetentionStatistics,
} from '@/hooks/useStatistics';
import { createVisitorComposition } from './visitor-composition';
import { WeekRangePicker } from './WeekRangePicker';
import type {
  TimeSeriesPayload,
  VisitorStatisticsGranularity,
  VisitorStatisticsParams,
} from '@/types/api';

const GRANULARITIES: VisitorStatisticsGranularity[] = ['DAY', 'WEEK', 'MONTH'];
const QUICK_RANGES = [
  { days: 7, granularity: 'DAY' },
  { days: 30, granularity: 'WEEK' },
  { days: 90, granularity: 'MONTH' },
] as const satisfies ReadonlyArray<{
  days: number;
  granularity: VisitorStatisticsGranularity;
}>;

function getKstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getDefaultRange() {
  return getQuickRange(7);
}

function getQuickRange(days: number) {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const to = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() - (days - 1));
  return { from: today.toISOString().slice(0, 10), to };
}

function parseKstDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return Number.NaN;
  }
  return timestamp;
}

function validateRange(from: string, to: string): string | null {
  const fromTime = parseKstDate(from);
  const toTime = parseKstDate(to);
  const todayTime = parseKstDate(getKstToday());

  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) {
    return '조회 기간을 모두 입력해주세요.';
  }
  if (fromTime > toTime) {
    return '시작일은 종료일보다 늦을 수 없습니다.';
  }
  if (toTime > todayTime) {
    return '종료일은 오늘보다 늦을 수 없습니다.';
  }

  const inclusiveDays = Math.floor((toTime - fromTime) / (24 * 60 * 60 * 1000)) + 1;
  if (inclusiveDays > 90) {
    return '조회 기간은 최대 90일까지 선택할 수 있습니다.';
  }
  return null;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function monthToStart(month: string): number {
  const matched = /^(\d{4})-(\d{2})$/.exec(month);
  if (!matched) return Number.NaN;

  const year = Number(matched[1]);
  const monthNumber = Number(matched[2]);
  if (monthNumber < 1 || monthNumber > 12) return Number.NaN;
  return Date.UTC(year, monthNumber - 1, 1);
}

function getPickerValue(granularity: VisitorStatisticsGranularity, date: string): string {
  if (granularity === 'MONTH') return date.slice(0, 7);
  return date;
}

function getPickerLabels(granularity: VisitorStatisticsGranularity) {
  if (granularity === 'MONTH') return { from: '시작 월', to: '종료 월', type: 'month' };
  return { from: '시작일', to: '종료일', type: 'date' };
}

function getWeekStart(timestamp: number): number {
  const day = new Date(timestamp).getUTCDay() || 7;
  return timestamp - (day - 1) * 86_400_000;
}

function getSelectedRange(
  granularity: VisitorStatisticsGranularity,
  from: string,
  to: string
): { from: string; to: string; error: string | null } {
  if (granularity === 'DAY') {
    return { from, to, error: validateRange(from, to) };
  }

  const rangeStart =
    granularity === 'WEEK' ? getWeekStart(parseKstDate(from)) : monthToStart(from);
  const rangeEndStart =
    granularity === 'WEEK' ? getWeekStart(parseKstDate(to)) : monthToStart(to);
  if (Number.isNaN(rangeStart) || Number.isNaN(rangeEndStart)) {
    return {
      from: '',
      to: '',
      error: '조회 기간을 모두 입력해주세요.',
    };
  }

  const rangeEnd =
    granularity === 'WEEK'
      ? rangeEndStart + 6 * 86_400_000
      : Date.UTC(new Date(rangeEndStart).getUTCFullYear(), new Date(rangeEndStart).getUTCMonth() + 1, 0);
  const today = parseKstDate(getKstToday());
  const resolvedTo = rangeEnd > today && rangeEndStart <= today ? today : rangeEnd;
  const resolvedFrom = formatDate(rangeStart);
  const resolvedToDate = formatDate(resolvedTo);

  return { from: resolvedFrom, to: resolvedToDate, error: validateRange(resolvedFrom, resolvedToDate) };
}

interface StatisticsCardProps {
  title: string;
  description: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  stacked?: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function StatisticsCard({
  title,
  description,
  payload,
  seriesKeys,
  stacked,
  isLoading,
  isError,
  onRetry,
}: StatisticsCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <TimeSeriesChart
          payload={payload}
          seriesKeys={seriesKeys}
          stacked={stacked}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

interface StatisticsFiltersProps {
  initialFrom: string;
  initialTo: string;
  initialGranularity: VisitorStatisticsGranularity;
  initialQuickRangeDays?: number;
  onApply: (params: VisitorStatisticsParams, quickRangeDays?: number) => void;
}

function StatisticsFilters({
  initialFrom,
  initialTo,
  initialGranularity,
  initialQuickRangeDays,
  onApply,
}: StatisticsFiltersProps) {
  const [draftFrom, setDraftFrom] = useState(() => getPickerValue(initialGranularity, initialFrom));
  const [draftTo, setDraftTo] = useState(() => getPickerValue(initialGranularity, initialTo));
  const [draftGranularity, setDraftGranularity] =
    useState<VisitorStatisticsGranularity>(initialGranularity);
  const [selectedQuickRangeDays, setSelectedQuickRangeDays] = useState(initialQuickRangeDays);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedRange = getSelectedRange(draftGranularity, draftFrom, draftTo);
    if (selectedRange.error) {
      setValidationError(selectedRange.error);
      return;
    }

    setValidationError(null);
    setSelectedQuickRangeDays(undefined);
    onApply({ from: selectedRange.from, to: selectedRange.to, granularity: draftGranularity });
  };

  const handleGranularityChange = (value: VisitorStatisticsGranularity) => {
    const selectedRange = getSelectedRange(draftGranularity, draftFrom, draftTo);
    const range = selectedRange.error ? { from: initialFrom, to: initialTo } : selectedRange;
    const normalizedWeekRange =
      value === 'WEEK' ? getSelectedRange(value, range.from, range.to) : null;
    const nextRange =
      normalizedWeekRange && !normalizedWeekRange.error ? normalizedWeekRange : range;

    setDraftGranularity(value);
    setDraftFrom(getPickerValue(value, nextRange.from));
    setDraftTo(getPickerValue(value, nextRange.to));
    setSelectedQuickRangeDays(undefined);
    setValidationError(null);
  };

  const handleQuickRange = (quickRange: (typeof QUICK_RANGES)[number]) => {
    setValidationError(null);
    setSelectedQuickRangeDays(quickRange.days);
    const range = getQuickRange(quickRange.days);
    onApply({ ...range, granularity: quickRange.granularity }, quickRange.days);
  };

  const pickerLabels = getPickerLabels(draftGranularity);
  const maxPickerValue = getPickerValue(draftGranularity, getKstToday());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조회 조건</CardTitle>
        <CardDescription>한국 시간 기준으로 최대 90일까지 조회할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 space-y-2">
          <p className="text-sm font-medium">빠른 기간</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((quickRange) => (
              <Button
                key={quickRange.days}
                type="button"
                size="sm"
                variant={selectedQuickRangeDays === quickRange.days ? 'default' : 'outline'}
                aria-pressed={selectedQuickRangeDays === quickRange.days}
                onClick={() => handleQuickRange(quickRange)}
              >
                최근 {quickRange.days}일
              </Button>
            ))}
          </div>
        </div>
        <form className="flex flex-col gap-4 lg:flex-row lg:items-end" onSubmit={handleSubmit}>
          {draftGranularity === 'WEEK' ? (
            <label className="grid gap-2 text-sm font-medium">
              조회 주
              <WeekRangePicker
                from={draftFrom}
                to={draftTo}
                max={getKstToday()}
                onChange={(range) => {
                  setDraftFrom(range.from);
                  setDraftTo(range.to);
                  setSelectedQuickRangeDays(undefined);
                }}
              />
            </label>
          ) : (
            <>
              <label className="grid gap-2 text-sm font-medium">
                {pickerLabels.from}
                <Input
                  aria-label={pickerLabels.from}
                  type={pickerLabels.type}
                  max={maxPickerValue}
                  value={draftFrom}
                  onChange={(event) => {
                    setDraftFrom(event.target.value);
                    setSelectedQuickRangeDays(undefined);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {pickerLabels.to}
                <Input
                  aria-label={pickerLabels.to}
                  type={pickerLabels.type}
                  max={maxPickerValue}
                  value={draftTo}
                  onChange={(event) => {
                    setDraftTo(event.target.value);
                    setSelectedQuickRangeDays(undefined);
                  }}
                />
              </label>
            </>
          )}
          <label className="grid gap-2 text-sm font-medium">
            집계 단위
            <Select
              value={draftGranularity}
              onValueChange={(value) =>
                handleGranularityChange(value as VisitorStatisticsGranularity)
              }
            >
              <SelectTrigger aria-label="집계 단위" className="w-full lg:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">일별</SelectItem>
                <SelectItem value="WEEK">주별</SelectItem>
                <SelectItem value="MONTH">월별</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <Button type="submit">조회</Button>
        </form>
        {validationError && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function VisitorStatisticsPage() {
  const defaults = getDefaultRange();
  const [urlParams, setUrlParams] = useSearchParams();
  const requestedGranularity = urlParams.get('granularity');
  const requestedFrom = urlParams.get('from') ?? defaults.from;
  const requestedTo = urlParams.get('to') ?? defaults.to;
  const requestedRangeError = validateRange(requestedFrom, requestedTo);
  const appliedGranularity = GRANULARITIES.includes(
    requestedGranularity as VisitorStatisticsGranularity
  )
    ? (requestedGranularity as VisitorStatisticsGranularity)
    : 'DAY';
  const appliedFrom = requestedRangeError ? defaults.from : requestedFrom;
  const appliedTo = requestedRangeError ? defaults.to : requestedTo;
  const requestedQuickRangeDays = Number(urlParams.get('preset'));
  const appliedQuickRange = QUICK_RANGES.find((quickRange) => {
    const range = getQuickRange(quickRange.days);
    return (
      quickRange.days === requestedQuickRangeDays &&
      quickRange.granularity === appliedGranularity &&
      range.from === appliedFrom &&
      range.to === appliedTo
    );
  });

  useEffect(() => {
    if (
      urlParams.get('from') !== appliedFrom ||
      urlParams.get('to') !== appliedTo ||
      urlParams.get('granularity') !== appliedGranularity ||
      urlParams.get('preset') !== (appliedQuickRange ? String(appliedQuickRange.days) : null)
    ) {
      const nextParams: Record<string, string> = {
        from: appliedFrom,
        to: appliedTo,
        granularity: appliedGranularity,
      };
      if (appliedQuickRange) {
        nextParams.preset = String(appliedQuickRange.days);
      }
      setUrlParams(nextParams, { replace: true });
    }
  }, [appliedFrom, appliedGranularity, appliedQuickRange, appliedTo, setUrlParams, urlParams]);

  const queryParams: VisitorStatisticsParams = {
    from: appliedFrom,
    to: appliedTo,
    granularity: appliedGranularity,
  };
  const activeVisitorsQuery = useActiveVisitorStatistics(queryParams);
  const retentionQuery = useVisitorRetentionStatistics(queryParams);
  const visitorComposition = createVisitorComposition(activeVisitorsQuery.data);
  const activeLabel =
    appliedGranularity === 'DAY' ? 'DAU' : appliedGranularity === 'WEEK' ? 'WAU' : 'MAU';
  const rangeDescription = `${appliedFrom} ~ ${appliedTo}`;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">방문자 통계</h1>
        <p className="text-muted-foreground">방문자와 회원 활동 및 재방문 추이를 조회합니다.</p>
      </div>

      <StatisticsFilters
        key={`${appliedFrom}:${appliedTo}:${appliedGranularity}:${appliedQuickRange?.days ?? 'custom'}`}
        initialFrom={appliedFrom}
        initialTo={appliedTo}
        initialGranularity={appliedGranularity}
        initialQuickRangeDays={appliedQuickRange?.days}
        onApply={(params, quickRangeDays) => {
          const nextParams: Record<string, string> = {
            from: params.from,
            to: params.to,
            granularity: params.granularity,
          };
          if (quickRangeDays) {
            nextParams.preset = String(quickRangeDays);
          }
          setUrlParams(nextParams);
        }}
      />

      <div className="space-y-4">
        <StatisticsCard
          title={`방문자 ${activeLabel}`}
          description={rangeDescription}
          payload={visitorComposition}
          seriesKeys={['members', 'guestVisitors']}
          stacked
          isLoading={activeVisitorsQuery.isLoading}
          isError={activeVisitorsQuery.isError}
          onRetry={() => void activeVisitorsQuery.refetch()}
        />
        <StatisticsCard
          title="재방문율"
          description={rangeDescription}
          payload={retentionQuery.data}
          seriesKeys={['retentionRate']}
          isLoading={retentionQuery.isLoading}
          isError={retentionQuery.isError}
          onRetry={() => void retentionQuery.refetch()}
        />
      </div>
    </div>
  );
}
