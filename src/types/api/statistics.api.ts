/**
 * 통계 시계열 API 타입
 */

export const StatisticsApi = {
  visitors: {
    active: {
      endpoint: '/admin/api/v1/statistics/visitors/active',
      method: 'GET',
    },
    retention: {
      endpoint: '/admin/api/v1/statistics/visitors/retention',
      method: 'GET',
    },
  },
  alcohols: {
    popularity: {
      endpoint: '/admin/api/v1/statistics/alcohols/:alcoholId/popularity',
      method: 'GET',
    },
    observations: {
      endpoint: '/admin/api/v1/statistics/alcohols/:alcoholId/observations/:axis',
      method: 'GET',
    },
  },
} as const;

export type TimeSeriesGranularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type VisitorStatisticsGranularity = Exclude<TimeSeriesGranularity, 'HOUR'>;
export type AlcoholStatisticsGranularity = Exclude<TimeSeriesGranularity, 'DAY'>;
export type TimeSeriesUnit = 'COUNT' | 'PERCENT' | 'SCORE' | 'DECIMAL';
export type TimeSeriesFill = 'ZERO' | 'NULL' | 'PREVIOUS';
export type StatisticsObservationAxis = 'INTEREST' | 'RATING' | 'PICK' | 'ENGAGEMENT';

export interface TimeSeriesDescriptor {
  key: string;
  label: string;
  unit: TimeSeriesUnit;
  fill: TimeSeriesFill;
}

export interface TimeSeriesPoint {
  bucketAt: string;
  partial: boolean;
  values: Record<string, number | null>;
}

export interface TimeSeriesPayload {
  granularity: TimeSeriesGranularity;
  timezone: string;
  from: string;
  to: string;
  series: TimeSeriesDescriptor[];
  points: TimeSeriesPoint[];
}

export interface TimeSeriesQueryParams<TGranularity extends TimeSeriesGranularity> {
  from: string;
  to: string;
  granularity: TGranularity;
}

export type VisitorStatisticsParams = TimeSeriesQueryParams<VisitorStatisticsGranularity>;
export type AlcoholStatisticsParams = TimeSeriesQueryParams<AlcoholStatisticsGranularity>;
