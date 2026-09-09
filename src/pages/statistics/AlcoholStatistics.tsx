import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
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
    { key: 'pickValue', label: 'PICK 수' },
    { key: 'engagementValue', label: '참여 합계' },
  ],
  INTEREST: [
    { key: 'viewCount', label: '상세 조회 수' },
    { key: 'cumulativeViewCount', label: '누적 조회 수' },
  ],
  RATING: [
    { key: 'deltaRatingCount', label: '평점 수 증감' },
    { key: 'deltaRatingSum', label: '평점 합 증감' },
    { key: 'ratingCount', label: '누적 평점 수' },
    { key: 'ratingSum', label: '누적 평점 합' },
    { key: 'averageRating', label: '평균 평점' },
  ],
  PICK: [
    { key: 'deltaPickCount', label: 'PICK 증감' },
    { key: 'pickCount', label: 'PICK 수' },
    { key: 'unpickCount', label: 'UNPICK 수' },
  ],
  ENGAGEMENT: [
    { key: 'deltaReviewCount', label: '리뷰 증감' },
    { key: 'deltaLikeCount', label: '좋아요 증감' },
    { key: 'deltaDislikeCount', label: '싫어요 증감' },
    { key: 'deltaReplyCount', label: '댓글 증감' },
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
  description: string;
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
              ? '기간 증감'
              : item.key === 'viewCount'
                ? '기간 조회 수'
                : '누적·현재값';
  const description =
    item.key === 'averageRating'
      ? '평점 합을 평점 수로 나눈 값입니다. 평점이 없으면 표시하지 않습니다.'
      : item.key.startsWith('delta')
        ? '해당 집계 구간의 순증감이며 감소하면 음수로 표시합니다.'
        : item.key === 'unpickCount'
          ? '집계 시점에 찜 해제 상태인 수입니다. 기간 내 해제 횟수가 아닙니다.'
          : item.key === 'viewCount' || item.key === 'interestValue'
            ? '해당 집계 구간에 발생한 상세 조회 수입니다.'
            : `${item.label}의 시간별 변화입니다.`;
  return { ...item, unit, section, description };
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
  description,
  payload,
  seriesKeys,
  loading,
  error,
  retry,
  seriesColors,
}: {
  title: string;
  description: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  seriesColors?: Record<string, string | undefined>;
}) {
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
          description={series.map((item) => item.description).join(' ')}
          payload={query.data}
          seriesKeys={series.map((item) => item.key)}
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
        description={`${definition?.description ?? ''} 같은 집계 구간의 주류별 값을 비교하며, 데이터가 없는 구간은 선을 연결하지 않습니다.`}
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
    : 'POPULARITY';
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
  }, [
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
        <p className="text-muted-foreground">
          개별 지표를 분석하거나 최대 세 주류의 같은 지표를 비교합니다.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">조회 방식과 주류 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2" role="tablist" aria-label="주류 통계 조회 방식">
            {[
              ['individual', '개별 분석'],
              ['compare', '주류 비교'],
            ].map(([value, label]) => (
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
                      : { mode: value, metric: undefined }
                  )
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <AlcoholSearchSelect
            onSelect={(alcohol) =>
              mode === 'individual'
                ? update({ alcoholId: String(alcohol.alcoholId) })
                : !compareIds.includes(alcohol.alcoholId) && compareIds.length < 3
                  ? update({ ids: [...compareIds, alcohol.alcoholId].join(',') })
                  : undefined
            }
            excludeIds={selected}
            disabled={mode === 'compare' && compareIds.length >= 3}
            dropdownTestId="alcohol-statistics-search-dropdown"
          />
          {mode === 'individual' && individualDetail.data ? (
            <div className="rounded-md bg-muted/50 px-4 py-3">
              <p className="font-medium">{individualDetail.data.korName}</p>
              <p className="text-sm text-muted-foreground">
                {individualDetail.data.engName} · {individualDetail.data.korCategory}
              </p>
            </div>
          ) : null}
          {mode === 'compare' && compareIds.length ? (
            <div className="flex flex-wrap gap-2">
              {compareIds.map((id, index) => (
                <Button
                  key={id}
                  size="sm"
                  variant="secondary"
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
          ) : null}
        </CardContent>
      </Card>
      {selected.length ? (
        <>
          <FilterCard
            params={params}
            onApply={(next) =>
              update({ from: next.from, to: next.to, granularity: next.granularity })
            }
          />
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-base">지표 그룹</CardTitle>
                <CardDescription>
                  {mode === 'individual'
                    ? '지표의 의미와 단위에 따라 차트를 나누어 표시합니다.'
                    : '비교할 단일 지표를 선택하세요.'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={group}
                  onValueChange={(value) => update({ group: value, metric: undefined })}
                >
                  <SelectTrigger aria-label="통계 지표 그룹" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mode === 'compare' ? (
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
                ) : null}
              </div>
            </CardHeader>
          </Card>
          {mode === 'individual' && individualId ? (
            <IndividualCharts id={individualId} group={group} params={params} />
          ) : (
            <CompareChart selectedIds={compareIds} group={group} metric={metric} params={params} />
          )}
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
