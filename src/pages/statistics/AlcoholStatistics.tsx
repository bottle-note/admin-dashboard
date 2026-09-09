import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';

import { AlcoholSearchSelect } from '@/components/common/AlcoholSearchSelect';
import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
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
import {
  useAdminAlcoholDetail,
} from '@/hooks/useAdminAlcohols';
import {
  useAlcoholObservationStatistics,
  useAlcoholPopularityStatistics,
} from '@/hooks/useStatistics';
import { getErrorMessage } from '@/lib/api-error';
import type {
  AlcoholStatisticsGranularity,
  AlcoholStatisticsParams,
  StatisticsObservationAxis,
  TimeSeriesPayload,
} from '@/types/api';

const GRANULARITY_OPTIONS: Array<{ value: AlcoholStatisticsGranularity; label: string }> = [
  { value: 'HOUR', label: '시간별' },
  { value: 'WEEK', label: '주간' },
  { value: 'MONTH', label: '월간' },
];

const OBSERVATION_AXIS_OPTIONS: Array<{ value: StatisticsObservationAxis; label: string }> = [
  { value: 'INTEREST', label: '조회수' },
  { value: 'RATING', label: '평점' },
  { value: 'PICK', label: '찜' },
  { value: 'ENGAGEMENT', label: '참여' },
];

function formatDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;
}

function getKstToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

function getDefaultStatisticsParams(): AlcoholStatisticsParams {
  const today = getKstToday();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 29);

  return { from: formatDate(from), to: formatDate(today), granularity: 'WEEK' };
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? timestamp
    : Number.NaN;
}

function validateStatisticsParams(params: AlcoholStatisticsParams) {
  const from = parseDate(params.from);
  const to = parseDate(params.to);
  const today = getKstToday().getTime();

  if (Number.isNaN(from) || Number.isNaN(to)) return '조회 기간을 모두 입력해주세요.';
  if (from > to) return '시작일은 종료일보다 늦을 수 없습니다.';
  if (to > today) return '종료일은 오늘보다 늦을 수 없습니다.';

  const inclusiveDays = Math.floor((to - from) / (24 * 60 * 60 * 1000)) + 1;
  const maximumDays = params.granularity === 'HOUR' ? 31 : 366;
  if (inclusiveDays > maximumDays) {
    return `${params.granularity === 'HOUR' ? '시간별' : '주·월간'} 조회 기간은 최대 ${maximumDays}일까지 선택할 수 있습니다.`;
  }

  return null;
}

function parseAlcoholId(value: string | null) {
  const alcoholId = Number(value);
  return Number.isSafeInteger(alcoholId) && alcoholId > 0 ? alcoholId : undefined;
}

interface ChartCardProps {
  title: string;
  description: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

function ChartCard({
  title,
  description,
  payload,
  seriesKeys,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: ChartCardProps) {
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
          chartType="line"
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

interface StatisticsFiltersProps {
  initialParams: AlcoholStatisticsParams;
  onApply: (params: AlcoholStatisticsParams) => void;
}

function StatisticsFilters({ initialParams, onApply }: StatisticsFiltersProps) {
  const [params, setParams] = useState(initialParams);
  const [validationError, setValidationError] = useState<string | null>(null);
  const today = formatDate(getKstToday());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateStatisticsParams(params);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onApply(params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조회 조건</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto] xl:items-end"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-2 text-sm font-medium">
            시작일
            <Input
              aria-label="주류 통계 시작일"
              type="date"
              max={today}
              value={params.from}
              onChange={(event) => setParams((current) => ({ ...current, from: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            종료일
            <Input
              aria-label="주류 통계 종료일"
              type="date"
              max={today}
              value={params.to}
              onChange={(event) => setParams((current) => ({ ...current, to: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            집계 단위
            <Select
              value={params.granularity}
              onValueChange={(value) =>
                setParams((current) => ({
                  ...current,
                  granularity: value as AlcoholStatisticsGranularity,
                }))
              }
            >
              <SelectTrigger aria-label="주류 통계 집계 단위">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRANULARITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button type="submit">조회</Button>
          {validationError ? (
            <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4" role="alert">
              {validationError}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function AlcoholStatisticsPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const defaults = getDefaultStatisticsParams();
  const alcoholId = parseAlcoholId(urlParams.get('alcoholId'));
  const granularity = GRANULARITY_OPTIONS.some((option) => option.value === urlParams.get('granularity'))
    ? (urlParams.get('granularity') as AlcoholStatisticsGranularity)
    : defaults.granularity;
  const requestedParams: AlcoholStatisticsParams = {
    from: urlParams.get('from') ?? defaults.from,
    to: urlParams.get('to') ?? defaults.to,
    granularity,
  };
  const observationAxis = OBSERVATION_AXIS_OPTIONS.some((option) => option.value === urlParams.get('axis'))
    ? (urlParams.get('axis') as StatisticsObservationAxis)
    : 'INTEREST';
  const dateError = validateStatisticsParams(requestedParams);
  const statisticsParams = dateError ? defaults : requestedParams;
  const alcoholQuery = useAdminAlcoholDetail(alcoholId);
  const selectedAlcoholId = alcoholQuery.data ? alcoholId : undefined;
  const popularityQuery = useAlcoholPopularityStatistics(selectedAlcoholId, statisticsParams);
  const observationQuery = useAlcoholObservationStatistics(
    selectedAlcoholId,
    observationAxis,
    statisticsParams
  );
  const popularityScoreKeys =
    popularityQuery.data?.series.filter((series) => series.unit === 'SCORE').map((series) => series.key) ?? [];
  const popularityCountKeys =
    popularityQuery.data?.series.filter((series) => series.unit === 'COUNT').map((series) => series.key) ?? [];
  const observationKeys = observationQuery.data?.series.map((series) => series.key) ?? [];

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(urlParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) nextParams.delete(key);
      else nextParams.set(key, value);
    });
    setUrlParams(nextParams);
  };

  const selectAlcohol = (alcoholId: number) => {
    updateUrlParams({
      alcoholId: String(alcoholId),
      from: defaults.from,
      to: defaults.to,
      granularity: defaults.granularity,
      axis: 'INTEREST',
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주류 통계</h1>
        <p className="text-muted-foreground">주류별 인기도와 실제 발생 지표의 추이를 조회합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">주류 선택</CardTitle>
          <CardDescription>이름을 입력해 조회할 주류를 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlcoholSearchSelect onSelect={(alcohol) => selectAlcohol(alcohol.alcoholId)} />
          {alcoholQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">선택한 주류 정보를 불러오는 중입니다.</p>
          ) : null}
          {alcoholQuery.isError ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-destructive" role="alert">
              <span>{getErrorMessage(alcoholQuery.error)}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => updateUrlParams({ alcoholId: undefined })}>
                선택 해제
              </Button>
            </div>
          ) : null}
          {alcoholQuery.data ? (
            <div className="flex min-w-0 items-center justify-between gap-4 rounded-md bg-muted/50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium" title={alcoholQuery.data.korName}>
                  {alcoholQuery.data.korName}
                </p>
                <p className="truncate text-sm text-muted-foreground" title={alcoholQuery.data.engName}>
                  {alcoholQuery.data.engName} · {alcoholQuery.data.korCategory}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => updateUrlParams({ alcoholId: undefined })}>
                변경
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedAlcoholId ? (
        <>
          <StatisticsFilters
            key={`${statisticsParams.from}:${statisticsParams.to}:${statisticsParams.granularity}`}
            initialParams={statisticsParams}
            onApply={(params) =>
              updateUrlParams({
                from: params.from,
                to: params.to,
                granularity: params.granularity,
              })
            }
          />

          <div className="space-y-4">
            <ChartCard
              title="인기도 점수"
              description="서버에서 계산한 인기도 점수입니다."
              payload={popularityQuery.data}
              seriesKeys={popularityScoreKeys}
              isLoading={popularityQuery.isLoading}
              isError={popularityQuery.isError}
              errorMessage={popularityQuery.isError ? getErrorMessage(popularityQuery.error) : undefined}
              onRetry={() => void popularityQuery.refetch()}
            />
            <ChartCard
              title="인기도 원본 수치"
              description="점수 계산에 사용된 건수 지표입니다."
              payload={popularityQuery.data}
              seriesKeys={popularityCountKeys}
              isLoading={popularityQuery.isLoading}
              isError={popularityQuery.isError}
              errorMessage={popularityQuery.isError ? getErrorMessage(popularityQuery.error) : undefined}
              onRetry={() => void popularityQuery.refetch()}
            />
            <Card className="min-w-0">
              <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-base">관찰 지표</CardTitle>
                  <CardDescription>선택한 기준의 실제 발생 추이입니다.</CardDescription>
                </div>
                <Select value={observationAxis} onValueChange={(axis) => updateUrlParams({ axis })}>
                  <SelectTrigger aria-label="관찰 기준" className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_AXIS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="min-w-0">
                <TimeSeriesChart
                  payload={observationQuery.data}
                  seriesKeys={observationKeys}
                  chartType="line"
                  isLoading={observationQuery.isLoading}
                  isError={observationQuery.isError}
                  errorMessage={
                    observationQuery.isError ? getErrorMessage(observationQuery.error) : undefined
                  }
                  onRetry={() => void observationQuery.refetch()}
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            조회할 주류를 선택하면 통계 차트가 표시됩니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
