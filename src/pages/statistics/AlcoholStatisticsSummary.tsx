import { Button } from '@/components/ui/button';
import { useAlcoholObservationStatistics } from '@/hooks/useStatistics';
import type { AlcoholStatisticsParams } from '@/types/api';

export function AlcoholStatisticsSummary({
  id,
  params,
}: {
  id: number;
  params: AlcoholStatisticsParams;
}) {
  const interest = useAlcoholObservationStatistics(id, 'INTEREST', params);
  const rating = useAlcoholObservationStatistics(id, 'RATING', params);
  const pick = useAlcoholObservationStatistics(id, 'PICK', params);
  const metrics = [
    { label: '기간 조회 수', key: 'viewCount', query: interest, sum: true, unit: '회' },
    { label: '평균 평점', key: 'averageRating', query: rating, sum: false, unit: '점' },
    { label: '평점 수', key: 'ratingCount', query: rating, sum: false, unit: '개' },
    { label: '찜 순증감', key: 'deltaPickCount', query: pick, sum: true, unit: '개' },
  ];
  return (
    <div className="space-y-3">
      <dl
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        data-testid="alcohol-statistics-summary"
      >
        {metrics.map(({ label, key, query, sum, unit }) => {
          const points = query.data?.points;
          const values = points?.map((point) => point.values[key]);
          const value = sum
            ? values?.length && values.every((value) => typeof value === 'number')
              ? values.reduce<number>((total, value) => total + (value as number), 0)
              : null
            : points?.[points.length - 1]?.values[key];
          const formatted =
            typeof value === 'number'
              ? `${key === 'deltaPickCount' && value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: key === 'averageRating' ? 2 : 0 })}${unit}`
              : '—';
          return (
            <div key={key} className="min-w-0 space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="break-words text-xl font-semibold tabular-nums">
                {query.isLoading ? '불러오는 중...' : query.isError ? '조회 실패' : formatted}
              </dd>
            </div>
          );
        })}
      </dl>
      {[interest, rating, pick].some((query) =>
        query.data?.points.some((point) => point.partial)
      ) && <p className="text-xs text-muted-foreground">집계 중</p>}
      {[interest, rating, pick].some((query) => query.isError) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            [interest, rating, pick]
              .filter((query) => query.isError)
              .forEach((query) => void query.refetch())
          }
        >
          요약 다시 조회
        </Button>
      )}
    </div>
  );
}
