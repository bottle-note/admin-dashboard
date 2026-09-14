import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { AlcoholStatisticsSearch } from './AlcoholStatisticsSearch';
import { WeekRangePicker } from './WeekRangePicker';
import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
import { Badge } from '@/components/ui/badge';
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
import { useAdminAlcoholDetail } from '@/hooks/useAdminAlcohols';
import {
  useAlcoholObservationStatistics,
  useAlcoholPopularityStatistics,
} from '@/hooks/useStatistics';
import { getErrorMessage } from '@/lib/api-error';
import type {
  AlcoholStatisticsGranularity,
  AlcoholStatisticsParams,
  StatisticsObservationAxis,
  TimeSeriesDescriptor,
  TimeSeriesPayload,
} from '@/types/api';

const granularities: Array<{ value: AlcoholStatisticsGranularity; label: string }> = [
  { value: 'HOUR', label: '시간별' },
  { value: 'WEEK', label: '주별' },
  { value: 'MONTH', label: '월별' },
];
const quickRanges = [
  { days: 7, granularity: 'HOUR' },
  { days: 30, granularity: 'WEEK' },
  { days: 90, granularity: 'MONTH' },
] as const satisfies ReadonlyArray<{
  days: number;
  granularity: AlcoholStatisticsGranularity;
}>;
const groups: Array<{ value: 'POPULARITY' | StatisticsObservationAxis; label: string }> = [
  { value: 'POPULARITY', label: '인기도' },
  { value: 'INTEREST', label: '조회' },
  { value: 'RATING', label: '평가' },
  { value: 'PICK', label: '찜' },
  { value: 'ENGAGEMENT', label: '참여' },
];
type Group = (typeof groups)[number]['value'];
const metricDefinitionLabels: Record<Group, Array<{ key: string; label: string }>> = {
  POPULARITY: [
    { key: 'popularityScore', label: '최종 인기도' },
    { key: 'interestScore', label: '관심도 점수' },
    { key: 'ratingScore', label: '평가도 점수' },
    { key: 'pickScore', label: '선호도 점수' },
    { key: 'engagementScore', label: '참여도 점수' },
  ],
  INTEREST: [
    { key: 'viewCount', label: '상세 조회 수' },
    { key: 'cumulativeViewCount', label: '누적 조회 수' },
  ],
  RATING: [
    { key: 'deltaRatingCount', label: '평점 수 순증감' },
    { key: 'ratingCount', label: '누적 평점 수' },
    { key: 'averageRating', label: '평균 평점' },
  ],
  PICK: [
    { key: 'deltaPickCount', label: '찜 순증감' },
    { key: 'pickCount', label: '찜 수' },
  ],
  ENGAGEMENT: [
    { key: 'deltaReviewCount', label: '리뷰 순증감' },
    { key: 'deltaLikeCount', label: '좋아요 순증감' },
    { key: 'deltaDislikeCount', label: '싫어요 순증감' },
    { key: 'deltaReplyCount', label: '댓글 순증감' },
    { key: 'reviewCount', label: '리뷰 수' },
    { key: 'likeCount', label: '좋아요 수' },
    { key: 'dislikeCount', label: '싫어요 수' },
    { key: 'replyCount', label: '댓글 수' },
  ],
};
type MetricDefinition = {
  key: string;
  label: string;
  unit: TimeSeriesDescriptor['unit'];
};
const colors = [
  '#ff9e20',
  '#215e61',
  '#6c5ce7',
  '#d64f67',
  '#3b8b45',
  '#2e7ebc',
  '#a65628',
  '#7b4f9e',
  '#bd6b00',
  '#5f6b72',
];
const compareColorAssignments = new Map<number, string>();
const popularityColors: Record<string, string> = {
  popularityScore: '#ff9e20',
  interestScore: '#215e61',
  ratingScore: '#6c5ce7',
  pickScore: '#d64f67',
  engagementScore: '#3b8b45',
};
const observationColors: Record<string, string> = {
  viewCount: '#ff9e20',
  averageRating: '#ff9e20',
  deltaRatingCount: '#6c5ce7',
  pickCount: '#ff9e20',
  deltaPickCount: '#d64f67',
  deltaReviewCount: '#ff9e20',
  deltaLikeCount: '#3b8b45',
  deltaDislikeCount: '#d64f67',
  deltaReplyCount: '#2e7ebc',
};
const observationChartOptions: Record<
  StatisticsObservationAxis,
  Array<{ key: string; label: string; chartType: 'line' | 'bar' }>
> = {
  INTEREST: [{ key: 'viewCount', label: '기간 조회 수', chartType: 'bar' }],
  RATING: [
    { key: 'averageRating', label: '평균 평점', chartType: 'line' },
    { key: 'deltaRatingCount', label: '평점 수 순증감', chartType: 'bar' },
  ],
  PICK: [
    { key: 'pickCount', label: '찜 수', chartType: 'line' },
    { key: 'deltaPickCount', label: '찜 순증감', chartType: 'bar' },
  ],
  ENGAGEMENT: [
    { key: 'deltaReviewCount', label: '리뷰', chartType: 'bar' },
    { key: 'deltaLikeCount', label: '좋아요', chartType: 'bar' },
    { key: 'deltaDislikeCount', label: '싫어요', chartType: 'bar' },
    { key: 'deltaReplyCount', label: '댓글', chartType: 'bar' },
  ],
};
const filterSchema = z.object({
  from: z.string(),
  to: z.string(),
  granularity: z.enum(['HOUR', 'WEEK', 'MONTH']),
});
type FilterValues = z.infer<typeof filterSchema>;

function metricDefinition(item: { key: string; label: string }): MetricDefinition {
  const unit = item.key.includes('Score')
    ? 'SCORE'
    : item.key === 'averageRating'
      ? 'DECIMAL'
      : 'COUNT';
  return { ...item, unit };
}
const metricDefinitions: Record<Group, MetricDefinition[]> = Object.fromEntries(
  Object.entries(metricDefinitionLabels).map(([group, items]) => [
    group,
    items.map((item) => metricDefinition(item)),
  ])
) as Record<Group, MetricDefinition[]>;

const kstToday = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
function defaultParams(): AlcoholStatisticsParams {
  const to = kstToday();
  const d = new Date(`${to}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 29);
  return { from: d.toISOString().slice(0, 10), to, granularity: 'WEEK' };
}
function quickRange(days: number) {
  const to = kstToday();
  const date = new Date(`${to}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return { from: date.toISOString().slice(0, 10), to };
}
function isExactDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function validate(params: AlcoholStatisticsParams) {
  const from = Date.parse(`${params.from}T00:00:00Z`);
  const to = Date.parse(`${params.to}T00:00:00Z`);
  if (
    !isExactDate(params.from) ||
    !isExactDate(params.to) ||
    Number.isNaN(from) ||
    Number.isNaN(to)
  )
    return '조회 기간을 모두 입력해주세요.';
  if (from > to) return '시작일은 종료일보다 늦을 수 없습니다.';
  if (params.to > kstToday()) return '종료일은 오늘보다 늦을 수 없습니다.';
  const max = params.granularity === 'HOUR' ? 31 : 366;
  return (to - from) / 86400000 + 1 > max
    ? `${params.granularity === 'HOUR' ? '시간별' : '주·월간'} 조회 기간은 최대 ${max}일까지 선택할 수 있습니다.`
    : null;
}
function pickerValue(granularity: AlcoholStatisticsGranularity, date: string) {
  return granularity === 'MONTH' ? date.slice(0, 7) : date;
}
function weekStart(timestamp: number) {
  const day = new Date(timestamp).getUTCDay() || 7;
  return timestamp - (day - 1) * 86_400_000;
}
function monthStart(value: string) {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return Number.NaN;
  return Date.UTC(year, month - 1, 1);
}
function selectedRange(
  granularity: AlcoholStatisticsGranularity,
  from: string,
  to: string
): { from: string; to: string; granularity: AlcoholStatisticsGranularity; error: string | null } {
  if (granularity === 'HOUR') {
    const params = { from, to, granularity };
    return { ...params, error: validate(params) };
  }

  const fromTime =
    granularity === 'WEEK' ? weekStart(Date.parse(`${from}T00:00:00Z`)) : monthStart(from);
  const toStart =
    granularity === 'WEEK' ? weekStart(Date.parse(`${to}T00:00:00Z`)) : monthStart(to);
  if (Number.isNaN(fromTime) || Number.isNaN(toStart)) {
    return { from: '', to: '', granularity, error: '조회 기간을 모두 입력해주세요.' };
  }

  const rangeEnd =
    granularity === 'WEEK'
      ? toStart + 6 * 86_400_000
      : Date.UTC(new Date(toStart).getUTCFullYear(), new Date(toStart).getUTCMonth() + 1, 0);
  const today = Date.parse(`${kstToday()}T00:00:00Z`);
  const params = {
    from: new Date(fromTime).toISOString().slice(0, 10),
    to: new Date(Math.min(rangeEnd, today)).toISOString().slice(0, 10),
    granularity,
  };
  return { ...params, error: validate(params) };
}
function parseIds(value: string | null) {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0)
    ),
  ].slice(0, 3);
}
const groupLabel = (value: Group) =>
  groups.find((group) => group.value === value)?.label ?? '인기도';

function FilterCard({
  params,
  quickRangeDays,
  onApply,
}: {
  params: AlcoholStatisticsParams;
  quickRangeDays?: number;
  onApply: (params: AlcoholStatisticsParams, quickRangeDays?: number) => void;
}) {
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      from: pickerValue(params.granularity, params.from),
      to: pickerValue(params.granularity, params.to),
      granularity: params.granularity,
    },
  });
  const [selectedQuickRangeDays, setSelectedQuickRangeDays] = useState(quickRangeDays);
  const selectedGranularity = useWatch({ control: form.control, name: 'granularity' });
  const draftFrom = useWatch({ control: form.control, name: 'from' });
  const draftTo = useWatch({ control: form.control, name: 'to' });
  const pickerLabels =
    selectedGranularity === 'MONTH'
      ? { from: '시작 월', to: '종료 월', type: 'month' as const }
      : { from: '시작일', to: '종료일', type: 'date' as const };
  const maxPickerValue = pickerValue(selectedGranularity, kstToday());

  const changeGranularity = (granularity: AlcoholStatisticsGranularity) => {
    const current = selectedRange(selectedGranularity, draftFrom, draftTo);
    const range = current.error ? params : current;
    const normalized =
      granularity === 'WEEK'
        ? selectedRange(granularity, range.from, range.to)
        : { ...range, granularity };
    form.setValue('granularity', granularity);
    form.setValue('from', pickerValue(granularity, normalized.from));
    form.setValue('to', pickerValue(granularity, normalized.to));
    setSelectedQuickRangeDays(undefined);
    form.clearErrors();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조회 조건</CardTitle>
        <CardDescription>
          시간별은 최대 31일, 주별·월별은 최대 366일까지 조회할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 space-y-2">
          <p className="text-sm font-medium">빠른 기간</p>
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.days}
                type="button"
                size="sm"
                variant={selectedQuickRangeDays === range.days ? 'default' : 'outline'}
                aria-pressed={selectedQuickRangeDays === range.days}
                onClick={() => {
                  setSelectedQuickRangeDays(range.days);
                  onApply(
                    { ...quickRange(range.days), granularity: range.granularity },
                    range.days
                  );
                }}
              >
                최근 {range.days}일
              </Button>
            ))}
          </div>
        </div>
        <form
          className="flex flex-col gap-4 lg:flex-row lg:items-end"
          onSubmit={form.handleSubmit((value) => {
            if (selectedQuickRangeDays) {
              onApply(params, selectedQuickRangeDays);
              return;
            }
            const range = selectedRange(value.granularity, value.from, value.to);
            if (range.error) return form.setError('to', { message: range.error });
            onApply(range);
          })}
        >
          {selectedGranularity === 'WEEK' ? (
            <label className="grid gap-2 text-sm font-medium">
              조회 주
              <WeekRangePicker
                from={draftFrom}
                to={draftTo}
                max={kstToday()}
                onChange={(range) => {
                  form.setValue('from', range.from);
                  form.setValue('to', range.to);
                  setSelectedQuickRangeDays(undefined);
                  form.clearErrors();
                }}
              />
            </label>
          ) : (
            <>
              <label className="grid gap-2 text-sm font-medium">
                {pickerLabels.from}
                <Input
                  aria-label={`주류 통계 ${pickerLabels.from}`}
                  type={pickerLabels.type}
                  max={maxPickerValue}
                  value={draftFrom}
                  onChange={(event) => {
                    form.setValue('from', event.target.value);
                    setSelectedQuickRangeDays(undefined);
                    form.clearErrors();
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {pickerLabels.to}
                <Input
                  aria-label={`주류 통계 ${pickerLabels.to}`}
                  type={pickerLabels.type}
                  max={maxPickerValue}
                  value={draftTo}
                  onChange={(event) => {
                    form.setValue('to', event.target.value);
                    setSelectedQuickRangeDays(undefined);
                    form.clearErrors();
                  }}
                />
              </label>
            </>
          )}
          <label className="grid gap-2 text-sm font-medium">
            집계 단위
            <Select
              value={selectedGranularity}
              onValueChange={(value) => changeGranularity(value as AlcoholStatisticsGranularity)}
            >
              <SelectTrigger aria-label="주류 통계 집계 단위" className="w-full lg:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {granularities.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button type="submit">조회</Button>
        </form>
        {form.formState.errors.to?.message ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {form.formState.errors.to.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
function ChartCard({
  title,
  payload,
  seriesKeys,
  loading,
  error,
  retry,
  seriesColors,
  yAxisDomain,
  chartType = 'line',
}: {
  title: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  seriesColors?: Record<string, string | undefined>;
  yAxisDomain?: [number, number];
  chartType?: 'line' | 'bar';
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <TimeSeriesChart
          payload={payload}
          seriesKeys={seriesKeys}
          chartType={chartType}
          isLoading={loading}
          isError={Boolean(error)}
          errorMessage={error ? getErrorMessage(error) : undefined}
          onRetry={retry}
          seriesColors={seriesColors}
          yAxisDomain={yAxisDomain}
        />
      </CardContent>
    </Card>
  );
}

const popularityComponents = [
  { key: 'interestScore', label: '관심도' },
  { key: 'ratingScore', label: '평가도' },
  { key: 'pickScore', label: '선호도' },
  { key: 'engagementScore', label: '참여도' },
] as const;

function formatPopularityScore(value: number | null | undefined) {
  return typeof value === 'number'
    ? `${(value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}점`
    : '—';
}

function formatPopularityDate(
  value: string,
  granularity: AlcoholStatisticsGranularity,
  timezone: string
) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone || 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(granularity === 'HOUR' ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}),
  }).format(new Date(value));
}

function latestValue(payload: TimeSeriesPayload | undefined, key: string) {
  return payload?.points[payload.points.length - 1]?.values[key];
}

function sumValues(payload: TimeSeriesPayload | undefined, key: string) {
  const values = payload?.points.map((point) => point.values[key]);
  return values?.length && values.every((value) => typeof value === 'number')
    ? values.reduce<number>((total, value) => total + (value as number), 0)
    : null;
}

function formatObservationValue(
  value: number | null | undefined,
  unit: '회' | '개' | '점',
  signed = false
) {
  if (typeof value !== 'number') return '—';
  return `${signed && value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', {
    maximumFractionDigits: unit === '점' ? 2 : 0,
  })}${unit}`;
}

function IndividualCharts({
  id,
  group,
  params,
}: {
  id: number;
  group: Group;
  params: AlcoholStatisticsParams;
}) {
  const popularity = useAlcoholPopularityStatistics(
    group === 'POPULARITY' ? id : undefined,
    params
  );
  const observations = useAlcoholObservationStatistics(
    group === 'POPULARITY' ? undefined : id,
    group === 'POPULARITY' ? 'INTEREST' : group,
    params
  );
  const [visiblePopularityComponents, setVisiblePopularityComponents] = useState<string[]>([]);
  const [selectedObservationMetric, setSelectedObservationMetric] = useState('viewCount');
  const [visibleEngagementMetrics, setVisibleEngagementMetrics] = useState([
    'deltaReviewCount',
  ]);
  if (group === 'POPULARITY') {
    const scoreDefinitions = metricDefinitions.POPULARITY;
    const closedPoints =
      popularity.data?.points.filter(
        (point) => !point.partial && typeof point.values.popularityScore === 'number'
      ) ?? [];
    const latest = closedPoints[closedPoints.length - 1];
    const previous = closedPoints[closedPoints.length - 2];
    const latestScore = latest?.values.popularityScore;
    const previousScore = previous?.values.popularityScore;
    const change =
      typeof latestScore === 'number' && typeof previousScore === 'number'
        ? (latestScore - previousScore) * 100
        : null;
    const chartPayload = popularity.data
      ? {
          ...popularity.data,
          series: popularity.data.series
            .filter((series) =>
              scoreDefinitions.some((definition) => definition.key === series.key)
            )
            .map((series) => ({
              ...series,
              label:
                scoreDefinitions.find((definition) => definition.key === series.key)?.label ??
                series.label,
              unit: 'DECIMAL' as const,
            })),
          points: popularity.data.points.map((point) => ({
            ...point,
            values: Object.fromEntries(
              scoreDefinitions.map((definition) => {
                const value = point.values[definition.key];
                return [definition.key, typeof value === 'number' ? value * 100 : null];
              })
            ),
          })),
        }
      : undefined;

    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">인기도 지수</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-6">
          {latest ? (
            <>
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">최근 확정 인기도</p>
                  <p
                    className="text-3xl font-semibold tabular-nums"
                    data-testid="alcohol-popularity-score"
                  >
                    {formatPopularityScore(latestScore)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이전 집계 대비</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {change === null
                      ? '—'
                      : `${change > 0 ? '+' : ''}${change.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}점`}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPopularityDate(
                    latest.bucketAt,
                    params.granularity,
                    popularity.data?.timezone ?? 'Asia/Seoul'
                  )}{' '}
                  기준
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {popularityComponents.map((component) => {
                  const value = latest.values[component.key];
                  const score = typeof value === 'number' ? value * 100 : null;
                  return (
                    <div key={component.key} className="min-w-0 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="text-sm text-muted-foreground">{component.label}</dt>
                        <dd className="font-semibold tabular-nums">
                          {formatPopularityScore(value)}
                        </dd>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${component.label} 점수`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={score ?? undefined}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                      >
                        {score !== null && (
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, score))}%`,
                              backgroundColor: popularityColors[component.key],
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </dl>
            </>
          ) : popularity.isLoading ? (
            <p className="text-sm text-muted-foreground">인기도를 불러오는 중...</p>
          ) : popularity.isError ? null : (
            <p className="text-sm text-muted-foreground">확정된 인기도 점수가 없습니다.</p>
          )}

          <div className="space-y-4 border-t pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">인기도 추이</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="px-3 py-1.5">최종 인기도</Badge>
                {popularityComponents.map((component) => {
                  const visible = visiblePopularityComponents.includes(component.key);
                  return (
                    <Button
                      key={component.key}
                      type="button"
                      size="sm"
                      variant={visible ? 'secondary' : 'outline'}
                      aria-pressed={visible}
                      onClick={() =>
                        setVisiblePopularityComponents((current) =>
                          visible
                            ? current.filter((key) => key !== component.key)
                            : [...current, component.key]
                        )
                      }
                    >
                      {component.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <TimeSeriesChart
              payload={chartPayload}
              seriesKeys={['popularityScore', ...visiblePopularityComponents]}
              chartType="line"
              isLoading={popularity.isLoading}
              isError={popularity.isError}
              errorMessage={popularity.error ? getErrorMessage(popularity.error) : undefined}
              onRetry={() => void popularity.refetch()}
              seriesColors={popularityColors}
              seriesStrokeWidths={{ popularityScore: 3 }}
              yAxisDomain={[0, 100]}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = observationChartOptions[group];
  const selectedOption =
    options.find((option) => option.key === selectedObservationMetric) ?? options[0]!;
  const seriesKeys =
    group === 'ENGAGEMENT'
      ? visibleEngagementMetrics.filter((key) => options.some((option) => option.key === key))
      : [selectedOption.key];
  const chartPayload = observations.data
    ? {
        ...observations.data,
        series: observations.data.series.map((series) => ({
          ...series,
          label:
            metricDefinitions[group].find((definition) => definition.key === series.key)?.label ??
            series.label,
        })),
      }
    : undefined;
  const summaryItems =
    group === 'INTEREST'
      ? [
          {
            label: '기간 조회 수',
            value: formatObservationValue(sumValues(observations.data, 'viewCount'), '회'),
          },
          {
            label: '누적 조회 수',
            value: formatObservationValue(
              latestValue(observations.data, 'cumulativeViewCount'),
              '회'
            ),
          },
        ]
      : group === 'RATING'
        ? [
            {
              label: '평균 평점',
              value: formatObservationValue(
                latestValue(observations.data, 'averageRating'),
                '점'
              ),
            },
            {
              label: '누적 평점 수',
              value: formatObservationValue(latestValue(observations.data, 'ratingCount'), '개'),
            },
            {
              label: '기간 평점 수 순증감',
              value: formatObservationValue(
                sumValues(observations.data, 'deltaRatingCount'),
                '개',
                true
              ),
            },
          ]
        : group === 'PICK'
          ? [
              {
                label: '현재 찜 수',
                value: formatObservationValue(latestValue(observations.data, 'pickCount'), '개'),
              },
              {
                label: '기간 찜 순증감',
                value: formatObservationValue(
                  sumValues(observations.data, 'deltaPickCount'),
                  '개',
                  true
                ),
              },
            ]
          : [
              {
                label: '리뷰 수',
                value: formatObservationValue(latestValue(observations.data, 'reviewCount'), '개'),
              },
              {
                label: '좋아요 수',
                value: formatObservationValue(latestValue(observations.data, 'likeCount'), '개'),
              },
              {
                label: '싫어요 수',
                value: formatObservationValue(latestValue(observations.data, 'dislikeCount'), '개'),
              },
              {
                label: '댓글 수',
                value: formatObservationValue(latestValue(observations.data, 'replyCount'), '개'),
              },
            ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{groupLabel(group)} 지표</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        {observations.isLoading ? (
          <p className="text-sm text-muted-foreground">지표를 불러오는 중...</p>
        ) : observations.isError ? null : (
          <dl
            className={`grid gap-5 ${group === 'ENGAGEMENT' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
            data-testid="alcohol-observation-summary"
          >
            {summaryItems.map((item, index) => (
              <div key={item.label} className="min-w-0 space-y-1">
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd
                  className={`${index === 0 && group !== 'ENGAGEMENT' ? 'text-3xl' : 'text-xl'} break-words font-semibold tabular-nums`}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="space-y-4 border-t pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">{groupLabel(group)} 추이</h3>
            <div className="flex flex-wrap gap-2">
              {group === 'INTEREST' ? (
                <Badge className="px-3 py-1.5">기간 조회 수</Badge>
              ) : group === 'ENGAGEMENT' ? (
                options.map((option) => {
                  const visible = visibleEngagementMetrics.includes(option.key);
                  return (
                    <Button
                      key={option.key}
                      type="button"
                      size="sm"
                      variant={visible ? 'secondary' : 'outline'}
                      aria-pressed={visible}
                      onClick={() =>
                        setVisibleEngagementMetrics((current) =>
                          visible
                            ? current.length === 1
                              ? current
                              : current.filter((key) => key !== option.key)
                            : [...current, option.key]
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  );
                })
              ) : (
                options.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    size="sm"
                    variant={selectedOption.key === option.key ? 'secondary' : 'outline'}
                    aria-pressed={selectedOption.key === option.key}
                    onClick={() => setSelectedObservationMetric(option.key)}
                  >
                    {option.label}
                  </Button>
                ))
              )}
            </div>
          </div>
          <TimeSeriesChart
            payload={chartPayload}
            seriesKeys={seriesKeys}
            chartType={group === 'ENGAGEMENT' ? 'bar' : selectedOption.chartType}
            isLoading={observations.isLoading}
            isError={observations.isError}
            errorMessage={observations.error ? getErrorMessage(observations.error) : undefined}
            onRetry={() => void observations.refetch()}
            seriesColors={observationColors}
          />
        </div>
      </CardContent>
    </Card>
  );
}
function merge(
  base: TimeSeriesPayload,
  metric: string,
  inputs: Array<{ id?: number; name: string; payload?: TimeSeriesPayload }>
): TimeSeriesPayload {
  const buckets = [
    ...new Set(
      inputs.flatMap((input) => input.payload?.points.map((point) => point.bucketAt) ?? [])
    ),
  ].sort();
  const unit = base.series.find((series) => series.key === metric)?.unit ?? 'COUNT';
  return {
    ...base,
    series: inputs
      .filter((input) => input.id)
      .map((input) => ({ key: `alcohol-${input.id}`, label: input.name, unit, fill: 'NULL' })),
    points: buckets.map((bucketAt) => ({
      bucketAt,
      partial: inputs.some((input) =>
        input.payload?.points.some((point) => point.bucketAt === bucketAt && point.partial)
      ),
      values: Object.fromEntries(
        inputs
          .filter((input) => input.id)
          .map((input) => [
            `alcohol-${input.id}`,
            input.payload?.points.find((point) => point.bucketAt === bucketAt)?.values[metric] ??
              null,
          ])
      ),
    })),
  };
}
function CompareChart({
  selectedIds,
  group,
  metric,
  params,
}: {
  selectedIds: number[];
  group: Group;
  metric: string;
  params: AlcoholStatisticsParams;
}) {
  const [id1, id2, id3] = selectedIds;
  const axis = group === 'POPULARITY' ? 'INTEREST' : group;
  const p1 = useAlcoholPopularityStatistics(group === 'POPULARITY' ? id1 : undefined, params);
  const p2 = useAlcoholPopularityStatistics(group === 'POPULARITY' ? id2 : undefined, params);
  const p3 = useAlcoholPopularityStatistics(group === 'POPULARITY' ? id3 : undefined, params);
  const o1 = useAlcoholObservationStatistics(
    group === 'POPULARITY' ? undefined : id1,
    axis,
    params
  );
  const o2 = useAlcoholObservationStatistics(
    group === 'POPULARITY' ? undefined : id2,
    axis,
    params
  );
  const o3 = useAlcoholObservationStatistics(
    group === 'POPULARITY' ? undefined : id3,
    axis,
    params
  );
  const d1 = useAdminAlcoholDetail(id1);
  const d2 = useAdminAlcoholDetail(id2);
  const d3 = useAdminAlcoholDetail(id3);
  const queries = group === 'POPULARITY' ? [p1, p2, p3] : [o1, o2, o3];
  const details = [d1, d2, d3];
  const base = queries.find((query) => query.data)?.data;
  const descriptor = base?.series.find((series) => series.key === metric);
  const definition = metricDefinitions[group].find((item) => item.key === metric);
  // 제거한 대상의 색상은 반환하되, 남은 대상의 색상은 유지한다.
  for (const id of compareColorAssignments.keys()) {
    if (!selectedIds.includes(id)) compareColorAssignments.delete(id);
  }
  selectedIds.forEach((id) => {
    if (compareColorAssignments.has(id)) return;
    const used = new Set(compareColorAssignments.values());
    compareColorAssignments.set(id, colors.find((color) => !used.has(color)) ?? colors[0]!);
  });
  const mergedPayload =
    base && descriptor
      ? merge(
          base,
          metric,
          queries.map((query, index) => ({
            id: selectedIds[index],
            name: details[index]?.data?.korName ?? `주류 ${selectedIds[index]}`,
            payload: query.data,
          }))
        )
      : undefined;
  const payload =
    mergedPayload && group === 'POPULARITY'
      ? {
          ...mergedPayload,
          series: mergedPayload.series.map((series) => ({ ...series, unit: 'DECIMAL' as const })),
          points: mergedPayload.points.map((point) => ({
            ...point,
            values: Object.fromEntries(
              Object.entries(point.values).map(([key, value]) => [
                key,
                typeof value === 'number' ? value * 100 : null,
              ])
            ),
          })),
        }
      : mergedPayload;
  const errors = queries
    .map((query, index) => ({ query, index }))
    .filter(({ query }) => query.isError);
  return (
    <div className="space-y-3">
      <ChartCard
        title={`${groupLabel(group)} · ${definition?.label ?? descriptor?.label ?? '지표'} 비교`}
        payload={payload}
        seriesKeys={selectedIds.map((id) => `alcohol-${id}`)}
        loading={queries.some((query) => query.isLoading)}
        error={undefined}
        retry={() => queries.forEach((query) => void query.refetch())}
        seriesColors={Object.fromEntries(
          selectedIds.map((id) => [`alcohol-${id}`, compareColorAssignments.get(id)])
        )}
        yAxisDomain={group === 'POPULARITY' ? [0, 100] : undefined}
      />
      {errors.map(({ query, index }) => (
        <div
          key={selectedIds[index]}
          role="alert"
          className="flex items-center gap-3 text-sm text-destructive"
        >
          {details[index]?.data?.korName ?? `주류 ${selectedIds[index]}`} 통계를 불러오지
          못했습니다.
          <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
            다시 시도
          </Button>
        </div>
      ))}
    </div>
  );
}

export function AlcoholStatisticsPage() {
  const [url, setUrl] = useSearchParams();
  const fallback = defaultParams();
  const mode = url.get('mode') === 'compare' ? 'compare' : 'individual';
  const group = groups.some((item) => item.value === url.get('group'))
    ? (url.get('group') as Group)
    : 'INTEREST';
  const candidate = {
    from: url.get('from') ?? fallback.from,
    to: url.get('to') ?? fallback.to,
    granularity: granularities.some((item) => item.value === url.get('granularity'))
      ? (url.get('granularity') as AlcoholStatisticsGranularity)
      : fallback.granularity,
  };
  const params = validate(candidate) ? fallback : candidate;
  const requestedQuickRangeDays = Number(url.get('preset'));
  const appliedQuickRange = quickRanges.find((range) => {
    const dates = quickRange(range.days);
    return (
      range.days === requestedQuickRangeDays &&
      range.granularity === params.granularity &&
      dates.from === params.from &&
      dates.to === params.to
    );
  });
  const individualId = parseIds(url.get('alcoholId'))[0];
  const compareIds = parseIds(url.get('ids'));
  const individualDetail = useAdminAlcoholDetail(individualId);
  const details = [
    useAdminAlcoholDetail(compareIds[0]),
    useAdminAlcoholDetail(compareIds[1]),
    useAdminAlcoholDetail(compareIds[2]),
  ];
  const metricSeries = metricDefinitions[group];
  const metric = metricSeries.some((series) => series.key === url.get('metric'))
    ? url.get('metric')!
    : (metricSeries[0]?.key ?? 'popularityScore');
  const update = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(url);
    Object.entries(values).forEach(([key, value]) =>
      value === undefined ? next.delete(key) : next.set(key, value)
    );
    setUrl(next);
  };
  useEffect(() => {
    const next = new URLSearchParams(url);
    const normalizedCompareIds = parseIds(url.get('ids'));
    next.set('mode', mode);
    next.set('from', params.from);
    next.set('to', params.to);
    next.set('granularity', params.granularity);
    next.set('group', group);
    if (appliedQuickRange) next.set('preset', String(appliedQuickRange.days));
    else next.delete('preset');
    if (mode === 'individual') {
      if (individualId) next.set('alcoholId', String(individualId));
      else next.delete('alcoholId');
    } else {
      if (normalizedCompareIds.length) next.set('ids', normalizedCompareIds.join(','));
      else next.delete('ids');
      next.set('metric', metric);
    }
    if (next.toString() !== url.toString()) setUrl(next, { replace: true });
  }, [
    appliedQuickRange,
    group,
    individualId,
    metric,
    mode,
    params.from,
    params.granularity,
    params.to,
    setUrl,
    url,
  ]);
  const selected = mode === 'compare' ? compareIds : individualId ? [individualId] : [];
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주류 통계</h1>
      </div>
      <FilterCard
        key={`${params.from}:${params.to}:${params.granularity}:${appliedQuickRange?.days ?? 'custom'}`}
        params={params}
        quickRangeDays={appliedQuickRange?.days}
        onApply={(next, quickRangeDays) =>
          update({
            from: next.from,
            to: next.to,
            granularity: next.granularity,
            preset: quickRangeDays ? String(quickRangeDays) : undefined,
          })
        }
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AlcoholStatisticsSearch
          keyword={url.get('keyword') ?? ''}
          onSearch={(keyword) => {
            const next = new URLSearchParams(url);
            if (keyword) next.set('keyword', keyword);
            else next.delete('keyword');
            setUrl(next, { replace: true });
          }}
          selectedIds={selected}
          disabled={mode === 'compare' && compareIds.length >= 3}
          onSelect={(alcohol) =>
            mode === 'individual'
              ? update({ alcoholId: String(alcohol.alcoholId) })
              : !compareIds.includes(alcohol.alcoholId) && compareIds.length < 3
                ? update({ ids: [...compareIds, alcohol.alcoholId].join(',') })
                : undefined
          }
        />
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="주류 통계 조회 방식">
                {(
                  [
                    ['individual', '개별 분석'],
                    ['compare', '주류 비교'],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={mode === value ? 'default' : 'outline'}
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() =>
                      update(
                        value === 'compare'
                          ? {
                              mode: value,
                              ids: compareIds.length
                                ? compareIds.join(',')
                                : individualId
                                  ? String(individualId)
                                  : undefined,
                              metric: undefined,
                            }
                          : {
                              mode: value,
                              alcoholId: individualId
                                ? String(individualId)
                                : compareIds[0]
                                  ? String(compareIds[0])
                                  : undefined,
                              metric: undefined,
                            }
                      )
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="min-w-0 space-y-6">
              {mode === 'individual' && individualId ? (
                <>
                  {individualDetail.isLoading ? (
                    <p className="text-sm text-muted-foreground">주류 정보를 불러오는 중...</p>
                  ) : individualDetail.isError ? (
                    <div role="alert" className="space-y-2 text-sm">
                      <p>주류 정보를 불러오지 못했습니다.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void individualDetail.refetch()}
                      >
                        다시 시도
                      </Button>
                    </div>
                  ) : individualDetail.data ? (
                    <div className="flex min-w-0 items-center gap-4">
                      {individualDetail.data.imageUrl && (
                        <img
                          src={individualDetail.data.imageUrl}
                          alt=""
                          className="h-16 w-12 shrink-0 rounded-md object-contain"
                        />
                      )}
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold">
                          {individualDetail.data.korName}
                        </h2>
                        <p className="break-words text-sm text-muted-foreground">
                          {individualDetail.data.engName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {individualDetail.data.korCategory}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : mode === 'compare' && compareIds.length ? (
                <div className="flex flex-wrap gap-2">
                  {compareIds.map((id, index) => (
                    <Button
                      key={id}
                      size="sm"
                      variant="secondary"
                      className="h-auto whitespace-normal text-left"
                      onClick={() =>
                        update({
                          ids: compareIds.filter((value) => value !== id).join(',') || undefined,
                        })
                      }
                    >
                      {details[index]?.data?.korName ?? `주류 ${id}`} ×
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  조회할 주류를 선택하면 통계 차트가 표시됩니다.
                </p>
              )}
              {selected.length > 0 && (
                <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="통계 지표 그룹">
                    {groups.map((item) => (
                      <Button
                        key={item.value}
                        size="sm"
                        variant={group === item.value ? 'default' : 'outline'}
                        role="tab"
                        aria-selected={group === item.value}
                        onClick={() => update({ group: item.value, metric: undefined })}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  {mode === 'compare' && (
                    <label className="grid gap-2 text-sm font-medium">
                      비교 지표
                      <Select value={metric} onValueChange={(value) => update({ metric: value })}>
                        <SelectTrigger aria-label="비교 지표" className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {metricSeries.map((item) => (
                            <SelectItem key={item.key} value={item.key}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {selected.length > 0 &&
            (mode === 'individual' && individualId ? (
              <IndividualCharts id={individualId} group={group} params={params} />
            ) : (
              <CompareChart
                selectedIds={compareIds}
                group={group}
                metric={metric}
                params={params}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
