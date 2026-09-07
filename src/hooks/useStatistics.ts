/**
 * 통계 시계열 Query 훅
 */

import { useApiQuery } from './useApiQuery';
import { statisticsKeys, statisticsService } from '@/services/statistics.service';
import {
  type AlcoholStatisticsParams,
  type StatisticsObservationAxis,
  type TimeSeriesPayload,
  type VisitorStatisticsParams,
} from '@/types/api';

interface UseStatisticsQueryOptions {
  enabled?: boolean;
}

export function useActiveVisitorStatistics(
  params: VisitorStatisticsParams,
  options: UseStatisticsQueryOptions = {}
) {
  return useApiQuery<TimeSeriesPayload>(
    statisticsKeys.visitors.active(params),
    () => statisticsService.getActiveVisitors(params),
    { enabled: options.enabled ?? true, staleTime: 1000 * 60 }
  );
}

export function useVisitorRetentionStatistics(
  params: VisitorStatisticsParams,
  options: UseStatisticsQueryOptions = {}
) {
  return useApiQuery<TimeSeriesPayload>(
    statisticsKeys.visitors.retention(params),
    () => statisticsService.getVisitorRetention(params),
    { enabled: options.enabled ?? true, staleTime: 1000 * 60 }
  );
}

export function useAlcoholPopularityStatistics(
  alcoholId: number | undefined,
  params: AlcoholStatisticsParams,
  options: UseStatisticsQueryOptions = {}
) {
  return useApiQuery<TimeSeriesPayload>(
    statisticsKeys.alcohols.popularity(alcoholId ?? 0, params),
    () => statisticsService.getAlcoholPopularity(alcoholId!, params),
    { enabled: Boolean(alcoholId) && (options.enabled ?? true), staleTime: 1000 * 60 }
  );
}

export function useAlcoholObservationStatistics(
  alcoholId: number | undefined,
  axis: StatisticsObservationAxis,
  params: AlcoholStatisticsParams,
  options: UseStatisticsQueryOptions = {}
) {
  return useApiQuery<TimeSeriesPayload>(
    statisticsKeys.alcohols.observations(alcoholId ?? 0, axis, params),
    () => statisticsService.getAlcoholObservations(alcoholId!, axis, params),
    { enabled: Boolean(alcoholId) && (options.enabled ?? true), staleTime: 1000 * 60 }
  );
}
