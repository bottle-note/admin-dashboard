import { Info } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { AlcoholStatisticsSearch } from './AlcoholStatisticsSearch';
import { AlcoholStatisticsSummary } from './AlcoholStatisticsSummary';
import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  { value: 'WEEK', label: '주간' },
  { value: 'MONTH', label: '월간' },
];
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
    { key: 'interestValue', label: '상세 조회 수' },
    { key: 'ratingValue', label: '누적 평점 수' },
    { key: 'pickValue', label: '찜 수' },
    { key: 'engagementValue', label: '참여 합계' },
  ],
  INTEREST: [
    { key: 'viewCount', label: '상세 조회 수' },
    { key: 'cumulativeViewCount', label: '누적 조회 수' },
  ],
  RATING: [
    { key: 'deltaRatingCount', label: '평점 수 순증감' },
    { key: 'deltaRatingSum', label: '평점 합 순증감' },
    { key: 'ratingCount', label: '누적 평점 수' },
    { key: 'ratingSum', label: '누적 평점 합' },
    { key: 'averageRating', label: '평균 평점' },
  ],
  PICK: [
    { key: 'deltaPickCount', label: '찜 순증감' },
    { key: 'pickCount', label: '찜 수' },
    { key: 'unpickCount', label: '찜 해제 상태 수' },
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
  section: string;
  help?: string;
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
const filterSchema = z.object({
  from: z.string(),
  to: z.string(),
  granularity: z.enum(['HOUR', 'WEEK', 'MONTH']),
});
type FilterValues = z.infer<typeof filterSchema>;

function metricDefinition(group: Group, item: { key: string; label: string }): MetricDefinition {
  const unit = item.key.includes('Score')
    ? 'SCORE'
    : item.key.includes('Sum') || item.key === 'averageRating'
      ? 'DECIMAL'
      : 'COUNT';
  const section =
    group === 'POPULARITY'
      ? unit === 'SCORE'
        ? '점수'
        : item.key === 'interestValue'
          ? '기간 조회 수'
          : '현재값'
      : group === 'RATING' && item.key === 'averageRating'
        ? '평균 평점'
        : group === 'RATING' && item.key === 'ratingSum'
          ? '누적 평점 합'
          : group === 'RATING' && item.key === 'ratingCount'
            ? '누적 평점 수'
            : item.key.startsWith('delta')
              ? '기간 순증감'
              : item.key === 'viewCount'
                ? '기간 조회 수'
                : '누적·현재값';
  const help =
    item.key === 'unpickCount'
      ? '집계 시점의 찜 해제 상태 수이며, 기간 내 해제 횟수와 다릅니다.'
      : undefined;
  return { ...item, unit, section, help };
}
const metricDefinitions: Record<Group, MetricDefinition[]> = Object.fromEntries(
  Object.entries(metricDefinitionLabels).map(([group, items]) => [
    group,
    items.map((item) => metricDefinition(group as Group, item)),
  ])
) as Record<Group, MetricDefinition[]>;

const kstToday = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
function defaultParams(): AlcoholStatisticsParams {
  const to = kstToday();
  const d = new Date(`${to}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 29);
  return { from: d.toISOString().slice(0, 10), to, granularity: 'WEEK' };
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
  onApply,
}: {
  params: AlcoholStatisticsParams;
  onApply: (params: AlcoholStatisticsParams) => void;
}) {
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: params,
  });
  const { from, to, granularity } = params;
  useEffect(() => form.reset({ from, to, granularity }), [form, from, to, granularity]);
  const selectedGranularity = useWatch({ control: form.control, name: 'granularity' });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">조회 조건</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto] xl:items-end"
          onSubmit={form.handleSubmit((value) => {
            const error = validate(value);
            if (error) return form.setError('to', { message: error });
            onApply(value);
          })}
        >
          <label className="grid gap-2 text-sm font-medium">
            시작일
            <Input
              aria-label="주류 통계 시작일"
              type="date"
              max={kstToday()}
              {...form.register('from')}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            종료일
            <Input
              aria-label="주류 통계 종료일"
              type="date"
              max={kstToday()}
              {...form.register('to')}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            집계 단위
            <Select
              value={selectedGranularity}
              onValueChange={(value) =>
                form.setValue('granularity', value as AlcoholStatisticsGranularity)
              }
            >
              <SelectTrigger aria-label="주류 통계 집계 단위">
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
          {form.formState.errors.to?.message ? (
            <p role="alert" className="text-sm text-destructive sm:col-span-2 xl:col-span-4">
              {form.formState.errors.to.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
function ChartCard({
  title,
  help,
  payload,
  seriesKeys,
  loading,
  error,
  retry,
  seriesColors,
  chartType = 'line',
}: {
  title: string;
  help?: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  seriesColors?: Record<string, string | undefined>;
  chartType?: 'line' | 'bar';
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {help && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label={`${title} 도움말`}
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{help}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
        />
      </CardContent>
    </Card>
  );
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
  const query = group === 'POPULARITY' ? popularity : observations;
  const cards = new Map<string, MetricDefinition[]>();
  metricDefinitions[group].forEach((definition) => {
    const key = `${definition.section}:${definition.unit}`;
    cards.set(key, [...(cards.get(key) ?? []), definition]);
  });
  return (
    <div className="space-y-4">
      {[...cards].map(([key, series]) => (
        <ChartCard
          key={key}
          title={`${groupLabel(group)} · ${key.split(':')[0]}`}
          help={series.find((item) => item.help)?.help}
          payload={
            query.data && {
              ...query.data,
              series: query.data.series.map((item) => ({
                ...item,
                label:
                  metricDefinitions[group].find((metric) => metric.key === item.key)?.label ??
                  item.label,
              })),
            }
          }
          seriesKeys={series.map((item) => item.key)}
          chartType={
            series.every(
              (item) =>
                item.key.startsWith('delta') ||
                item.key === 'viewCount' ||
                item.key === 'interestValue'
            )
              ? 'bar'
              : 'line'
          }
          loading={query.isLoading}
          error={query.error}
          retry={() => void query.refetch()}
        />
      ))}
    </div>
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
  const payload =
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
  const errors = queries
    .map((query, index) => ({ query, index }))
    .filter(({ query }) => query.isError);
  return (
    <div className="space-y-3">
      <ChartCard
        title={`${groupLabel(group)} · ${definition?.label ?? descriptor?.label ?? '지표'} 비교`}
        help={definition?.help}
        payload={payload}
        seriesKeys={selectedIds.map((id) => `alcohol-${id}`)}
        loading={queries.some((query) => query.isLoading)}
        error={undefined}
        retry={() => queries.forEach((query) => void query.refetch())}
        seriesColors={Object.fromEntries(
          selectedIds.map((id) => [`alcohol-${id}`, compareColorAssignments.get(id)])
        )}
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
    if (mode === 'individual') {
      if (individualId) next.set('alcoholId', String(individualId));
      else next.delete('alcoholId');
    } else {
      if (normalizedCompareIds.length) next.set('ids', normalizedCompareIds.join(','));
      else next.delete('ids');
      next.set('metric', metric);
    }
    if (next.toString() !== url.toString()) setUrl(next, { replace: true });
  }, [group, individualId, metric, mode, params.from, params.granularity, params.to, setUrl, url]);
  const selected = mode === 'compare' ? compareIds : individualId ? [individualId] : [];
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주류 통계</h1>
      </div>
      <FilterCard
        params={params}
        onApply={(next) => update({ from: next.from, to: next.to, granularity: next.granularity })}
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AlcoholStatisticsSearch
          keyword={url.get('keyword') ?? ''}
          onKeywordChange={(keyword) => {
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
                  <AlcoholStatisticsSummary id={individualId} params={params} />
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
