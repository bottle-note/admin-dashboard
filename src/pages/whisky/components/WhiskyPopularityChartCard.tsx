/**
 * 기존 위스키 상세에서 필요할 때만 조회하는 인기도 시계열 패널
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';

import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAlcoholObservationStatistics,
  useAlcoholPopularityStatistics,
} from '@/hooks/useStatistics';
import { getErrorMessage } from '@/lib/api-error';
import type {
  AlcoholStatisticsGranularity,
  AlcoholStatisticsParams,
  StatisticsObservationAxis,
} from '@/types/api';

const OBSERVATION_AXIS_OPTIONS: Array<{
  value: StatisticsObservationAxis;
  label: string;
}> = [
  { value: 'INTEREST', label: '관심' },
  { value: 'RATING', label: '평점' },
  { value: 'PICK', label: '찜' },
  { value: 'ENGAGEMENT', label: '참여' },
];

const GRANULARITY_OPTIONS: Array<{
  value: AlcoholStatisticsGranularity;
  label: string;
}> = [
  { value: 'HOUR', label: '시간별' },
  { value: 'WEEK', label: '주간' },
  { value: 'MONTH', label: '월간' },
];

function formatDate(date: Date) {
  return (
    String(date.getUTCFullYear()) +
    '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getUTCDate()).padStart(2, '0')
  );
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

  return {
    from: formatDate(from),
    to: formatDate(today),
    granularity: 'WEEK',
  };
}

function parseDate(value: string) {
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

function validateStatisticsParams(params: AlcoholStatisticsParams) {
  const from = parseDate(params.from);
  const to = parseDate(params.to);
  const today = getKstToday().getTime();

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return '조회 기간을 모두 입력해주세요.';
  }
  if (from > to) {
    return '시작일은 종료일보다 늦을 수 없습니다.';
  }
  if (to > today) {
    return '종료일은 오늘보다 늦을 수 없습니다.';
  }

  const inclusiveDays = Math.floor((to - from) / (24 * 60 * 60 * 1000)) + 1;
  const maxDays = params.granularity === 'HOUR' ? 31 : 366;
  if (inclusiveDays > maxDays) {
    return `${params.granularity === 'HOUR' ? '시간별' : '주·월간'} 조회 기간은 최대 ${maxDays}일까지 선택할 수 있습니다.`;
  }

  return null;
}

export interface WhiskyPopularityChartCardProps {
  alcoholId: number;
}

export function WhiskyPopularityChartCard({ alcoholId }: WhiskyPopularityChartCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [observationAxis, setObservationAxis] = useState<StatisticsObservationAxis>('INTEREST');
  const [statisticsParams, setStatisticsParams] =
    useState<AlcoholStatisticsParams>(getDefaultStatisticsParams);
  const [draftStatisticsParams, setDraftStatisticsParams] =
    useState<AlcoholStatisticsParams>(statisticsParams);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validAlcoholId = Number.isInteger(alcoholId) && alcoholId > 0 ? alcoholId : undefined;
  const isQueryEnabled = isOpen && validAlcoholId !== undefined;

  const popularityQuery = useAlcoholPopularityStatistics(validAlcoholId, statisticsParams, {
    enabled: isQueryEnabled,
  });
  const observationQuery = useAlcoholObservationStatistics(
    validAlcoholId,
    observationAxis,
    statisticsParams,
    { enabled: isQueryEnabled }
  );

  const popularityScoreKeys =
    popularityQuery.data?.series
      .filter((series) => series.unit === 'SCORE')
      .map((series) => series.key) ?? [];
  const popularityCountKeys =
    popularityQuery.data?.series
      .filter((series) => series.unit === 'COUNT')
      .map((series) => series.key) ?? [];
  const observationKeys = observationQuery.data?.series.map((series) => series.key) ?? [];
  const granularityLabel =
    GRANULARITY_OPTIONS.find((option) => option.value === statisticsParams.granularity)?.label ??
    statisticsParams.granularity;

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateStatisticsParams(draftStatisticsParams);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setStatisticsParams(draftStatisticsParams);
  };

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="group h-auto w-full justify-between rounded-lg px-6 py-5 text-left"
            >
              <span className="min-w-0">
                <CardTitle>인기도 추이</CardTitle>
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {statisticsParams.from} ~ {statisticsParams.to} · {granularityLabel}
                </span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent data-testid="whisky-popularity-panel" className="min-w-0">
          <CardContent className="min-w-0 space-y-8 border-t pt-6">
            <form
              className="grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto] xl:items-end"
              onSubmit={handleApply}
            >
              <label className="grid gap-2 text-sm font-medium">
                시작일
                <Input
                  aria-label="인기도 시작일"
                  type="date"
                  max={formatDate(getKstToday())}
                  value={draftStatisticsParams.from}
                  onChange={(event) =>
                    setDraftStatisticsParams((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                종료일
                <Input
                  aria-label="인기도 종료일"
                  type="date"
                  max={formatDate(getKstToday())}
                  value={draftStatisticsParams.to}
                  onChange={(event) =>
                    setDraftStatisticsParams((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                집계 단위
                <Select
                  value={draftStatisticsParams.granularity}
                  onValueChange={(value) =>
                    setDraftStatisticsParams((current) => ({
                      ...current,
                      granularity: value as AlcoholStatisticsGranularity,
                    }))
                  }
                >
                  <SelectTrigger aria-label="인기도 집계 단위" className="w-full">
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
              {validationError && (
                <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4" role="alert">
                  {validationError}
                </p>
              )}
            </form>

            <div className="grid min-w-0 gap-8 xl:grid-cols-2">
              <section className="min-w-0 space-y-3" aria-labelledby="popularity-score-title">
                <div>
                  <h3 id="popularity-score-title" className="font-semibold">
                    인기도 점수
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    서버에서 계산된 인기도 점수입니다.
                  </p>
                </div>
                <TimeSeriesChart
                  payload={popularityQuery.data}
                  seriesKeys={popularityScoreKeys}
                  chartType="line"
                  isLoading={popularityQuery.isLoading}
                  isError={popularityQuery.isError}
                  errorMessage={
                    popularityQuery.isError
                      ? getErrorMessage(popularityQuery.error)
                      : undefined
                  }
                  onRetry={() => void popularityQuery.refetch()}
                />
              </section>

              <section className="min-w-0 space-y-3" aria-labelledby="popularity-count-title">
                <div>
                  <h3 id="popularity-count-title" className="font-semibold">
                    인기도 원본 수치
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    점수 계산에 사용된 건수 지표입니다.
                  </p>
                </div>
                <TimeSeriesChart
                  payload={popularityQuery.data}
                  seriesKeys={popularityCountKeys}
                  chartType="line"
                  isLoading={popularityQuery.isLoading}
                  isError={popularityQuery.isError}
                  errorMessage={
                    popularityQuery.isError
                      ? getErrorMessage(popularityQuery.error)
                      : undefined
                  }
                  onRetry={() => void popularityQuery.refetch()}
                />
              </section>
            </div>

            <section className="min-w-0 space-y-3" aria-labelledby="observation-title">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h3 id="observation-title" className="font-semibold">
                    관찰 지표
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    선택한 기준의 실제 발생 추이입니다.
                  </p>
                </div>
                <Select
                  value={observationAxis}
                  onValueChange={(value) => setObservationAxis(value as StatisticsObservationAxis)}
                >
                  <SelectTrigger aria-label="관찰 기준" className="w-full sm:w-[160px]">
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
              </div>

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
            </section>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
