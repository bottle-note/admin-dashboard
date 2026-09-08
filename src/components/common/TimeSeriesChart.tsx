/**
 * 공용 TimeSeries 차트 컴포넌트
 * - 통합된 시계열 payload만 전달받아 렌더링
 * - series key subset로 렌더 라인을 제어
 */

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { Button } from '@/components/ui/button';
import type { TimeSeriesPayload, TimeSeriesDescriptor } from '@/types/api';

interface TimeSeriesChartProps {
  payload?: TimeSeriesPayload | null;
  /** 렌더링할 series key 하위 집합 */
  seriesKeys?: string[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

interface FlattenedPoint {
  bucketAt: string;
  bucketLabel: string;
  partial: boolean;
  [key: string]: string | number | boolean | null;
}

const SERIES_COLORS = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#0891b2', '#dc2626'];

export function TimeSeriesChart({
  payload,
  seriesKeys,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  className = '',
}: TimeSeriesChartProps) {
  const selectedSeries = useMemo(() => {
    if (!payload) {
      return [] as TimeSeriesDescriptor[];
    }

    if (seriesKeys === undefined) {
      return payload.series;
    }

    const keySet = new Set(seriesKeys);
    return payload.series.filter((series) => keySet.has(series.key));
  }, [payload, seriesKeys]);

  const chartData = useMemo<FlattenedPoint[]>(() => {
    if (!payload) {
      return [];
    }

    return payload.points.map((point) => {
      const row: FlattenedPoint = {
        bucketAt: point.bucketAt,
        bucketLabel: formatBucketLabel(point.bucketAt, payload.granularity, payload.timezone),
        partial: point.partial,
      };

      payload.series.forEach((series) => {
        const value = point.values[series.key];
        row[series.key] = value === undefined || value === null ? null : value;
      });

      return row;
    });
  }, [payload]);

  const valueDomain = useMemo((): [number, number] => {
    const numericValues = chartData.flatMap((row: FlattenedPoint) =>
      selectedSeries
        .map((series) => row[series.key])
        .filter(
          (rawValue): rawValue is number =>
            rawValue !== null && typeof rawValue === 'number' && Number.isFinite(rawValue)
        )
    );

    if (numericValues.length === 0) {
      return [0, 1];
    }

    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    const span = maxValue - minValue;

    if (minValue === 0 && maxValue === 0) {
      return [0, 1];
    }

    if (span === 0) {
      return [minValue - 1, maxValue + 1];
    }

    const pad = span * 0.1;
    return [minValue - pad, maxValue + pad];
  }, [chartData, selectedSeries]);

  if (isLoading) {
    return (
      <div className={`min-w-0 ${className}`}>
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          로딩 중입니다.
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`min-w-0 ${className}`}>
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center text-sm text-muted-foreground">
          <p>{errorMessage ?? '통계를 불러오지 못했습니다.'}</p>
          {onRetry ? <Button onClick={onRetry}>다시 시도</Button> : null}
        </div>
      </div>
    );
  }

  if (!payload || payload.series.length === 0 || payload.points.length === 0 || selectedSeries.length === 0) {
    return (
      <div className={`min-w-0 ${className}`}>
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucketLabel" interval={0} />
            <YAxis
              domain={valueDomain}
              tickFormatter={(value: string | number) =>
                formatAxisTick(Number(value), selectedSeries)
              }
            />
            <Tooltip
              content={(props) => <SeriesTooltip {...props} series={selectedSeries} />}
            />
            <Legend />
            {chartData
              .filter((point: FlattenedPoint) => point.partial)
              .map((point: FlattenedPoint) => (
                <ReferenceLine
                  key={point.bucketAt}
                  x={point.bucketLabel}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                />
              ))}
            {selectedSeries.map((series, index) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2}
                connectNulls={false}
                dot={false}
                activeDot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatAxisTick(
  value: number,
  series: Array<{ key: string; label: string; unit: TimeSeriesDescriptor['unit'] }>
): string {
  const preferredUnit = getPreferredUnit(series);

  if (series.length === 0) {
    return String(value);
  }

  return formatSeriesValue(value, preferredUnit);
}

function getPreferredUnit(series: Array<{ unit: TimeSeriesDescriptor['unit'] }>): TimeSeriesDescriptor['unit'] {
  if (series.some((item) => item.unit === 'PERCENT')) {
    return 'PERCENT';
  }

  if (series.some((item) => item.unit === 'SCORE')) {
    return 'SCORE';
  }

  if (series.some((item) => item.unit === 'DECIMAL')) {
    return 'DECIMAL';
  }

  return 'COUNT';
}

function formatBucketLabel(
  value: string,
  granularity: TimeSeriesPayload['granularity'],
  timezone: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (granularity === 'HOUR') {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone || 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (granularity === 'DAY' || granularity === 'WEEK') {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone || 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone || 'Asia/Seoul',
    year: 'numeric',
    month: 'short',
  }).format(date);
}

function formatSeriesValue(value: number, unit: TimeSeriesDescriptor['unit']): string {
  if (Number.isNaN(value)) {
    return '-';
  }

  if (unit === 'COUNT') {
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (unit === 'PERCENT') {
    return `${new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value)}%`;
  }

  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  }).format(value);
}

function SeriesTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  label?: number | string;
  payload: TooltipContentProps<number, string>['payload'];
  series: TimeSeriesDescriptor[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const valueByKey = new Map<string, number | null>();

  payload.forEach((entry) => {
    if (!entry || typeof entry.dataKey !== 'string') {
      return;
    }

    const rawValue = entry.value;
    if (
      rawValue === null ||
      rawValue === undefined ||
      (typeof rawValue === 'number' && Number.isNaN(rawValue))
    ) {
      valueByKey.set(entry.dataKey, null);
    } else {
      valueByKey.set(entry.dataKey, Number(rawValue));
    }
  });

  return (
    <div className="rounded-md border border-border bg-popover p-2 text-xs shadow">
      <p className="mb-2 font-medium">{String(label)}</p>
      {series.map((item) => {
        const value = valueByKey.get(item.key) ?? null;
        const formatted = value === null ? '-' : formatSeriesValue(value, item.unit);

        return (
          <p key={item.key} className="text-muted-foreground">
            <span className="text-foreground">{item.label}</span>: {formatted}
          </p>
        );
      })}
    </div>
  );
}
