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
import type {
  TimeSeriesPayload,
  VisitorStatisticsGranularity,
  VisitorStatisticsParams,
} from '@/types/api';

const GRANULARITIES: VisitorStatisticsGranularity[] = ['DAY', 'WEEK', 'MONTH'];

function getKstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getDefaultRange() {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const to = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() - 6);
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

interface StatisticsCardProps {
  title: string;
  description: string;
  payload?: TimeSeriesPayload;
  seriesKey: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function StatisticsCard({
  title,
  description,
  payload,
  seriesKey,
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
          seriesKeys={[seriesKey]}
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
  onApply: (params: VisitorStatisticsParams) => void;
}

function StatisticsFilters({
  initialFrom,
  initialTo,
  initialGranularity,
  onApply,
}: StatisticsFiltersProps) {
  const [draftFrom, setDraftFrom] = useState(initialFrom);
  const [draftTo, setDraftTo] = useState(initialTo);
  const [draftGranularity, setDraftGranularity] =
    useState<VisitorStatisticsGranularity>(initialGranularity);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateRange(draftFrom, draftTo);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onApply({ from: draftFrom, to: draftTo, granularity: draftGranularity });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조회 조건</CardTitle>
        <CardDescription>한국 시간 기준으로 최대 90일까지 조회할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4 lg:flex-row lg:items-end" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            시작일
            <Input
              aria-label="시작일"
              type="date"
              max={getKstToday()}
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            종료일
            <Input
              aria-label="종료일"
              type="date"
              max={getKstToday()}
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            집계 단위
            <Select
              value={draftGranularity}
              onValueChange={(value) =>
                setDraftGranularity(value as VisitorStatisticsGranularity)
              }
            >
              <SelectTrigger aria-label="집계 단위" className="w-full lg:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">일간</SelectItem>
                <SelectItem value="WEEK">주간</SelectItem>
                <SelectItem value="MONTH">월간</SelectItem>
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

  useEffect(() => {
    if (
      urlParams.get('from') !== appliedFrom ||
      urlParams.get('to') !== appliedTo ||
      urlParams.get('granularity') !== appliedGranularity
    ) {
      setUrlParams(
        { from: appliedFrom, to: appliedTo, granularity: appliedGranularity },
        { replace: true }
      );
    }
  }, [appliedFrom, appliedGranularity, appliedTo, setUrlParams, urlParams]);

  const queryParams: VisitorStatisticsParams = {
    from: appliedFrom,
    to: appliedTo,
    granularity: appliedGranularity,
  };
  const activeVisitorsQuery = useActiveVisitorStatistics(queryParams);
  const retentionQuery = useVisitorRetentionStatistics(queryParams);
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
        key={`${appliedFrom}:${appliedTo}:${appliedGranularity}`}
        initialFrom={appliedFrom}
        initialTo={appliedTo}
        initialGranularity={appliedGranularity}
        onApply={(params) =>
          setUrlParams({
            from: params.from,
            to: params.to,
            granularity: params.granularity,
          })
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <StatisticsCard
          title={`방문자 ${activeLabel}`}
          description={rangeDescription}
          payload={activeVisitorsQuery.data}
          seriesKey="visitors"
          isLoading={activeVisitorsQuery.isLoading}
          isError={activeVisitorsQuery.isError}
          onRetry={() => void activeVisitorsQuery.refetch()}
        />
        <StatisticsCard
          title={`회원 ${activeLabel}`}
          description={rangeDescription}
          payload={activeVisitorsQuery.data}
          seriesKey="members"
          isLoading={activeVisitorsQuery.isLoading}
          isError={activeVisitorsQuery.isError}
          onRetry={() => void activeVisitorsQuery.refetch()}
        />
        <StatisticsCard
          title="재방문율"
          description={rangeDescription}
          payload={retentionQuery.data}
          seriesKey="retentionRate"
          isLoading={retentionQuery.isLoading}
          isError={retentionQuery.isError}
          onRetry={() => void retentionQuery.refetch()}
        />
      </div>
    </div>
  );
}
