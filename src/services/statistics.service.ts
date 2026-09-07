/**
 * 통계 시계열 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import {
  StatisticsApi,
  type AlcoholStatisticsParams,
  type StatisticsObservationAxis,
  type TimeSeriesPayload,
  type VisitorStatisticsParams,
} from '@/types/api';

export const statisticsKeys = {
  all: ['statistics'] as const,
  visitors: {
    active: (params: VisitorStatisticsParams) =>
      [...statisticsKeys.all, 'visitors', 'active', params] as const,
    retention: (params: VisitorStatisticsParams) =>
      [...statisticsKeys.all, 'visitors', 'retention', params] as const,
  },
  alcohols: {
    popularity: (alcoholId: number, params: AlcoholStatisticsParams) =>
      [...statisticsKeys.all, 'alcohols', alcoholId, 'popularity', params] as const,
    observations: (
      alcoholId: number,
      axis: StatisticsObservationAxis,
      params: AlcoholStatisticsParams
    ) => [...statisticsKeys.all, 'alcohols', alcoholId, 'observations', axis, params] as const,
  },
};

export const statisticsService = {
  getActiveVisitors: async (params: VisitorStatisticsParams): Promise<TimeSeriesPayload> => {
    const response = await apiClient.get<TimeSeriesPayload>(StatisticsApi.visitors.active.endpoint, {
      params,
    });
    return response.data;
  },

  getVisitorRetention: async (params: VisitorStatisticsParams): Promise<TimeSeriesPayload> => {
    const response = await apiClient.get<TimeSeriesPayload>(StatisticsApi.visitors.retention.endpoint, {
      params,
    });
    return response.data;
  },

  getAlcoholPopularity: async (
    alcoholId: number,
    params: AlcoholStatisticsParams
  ): Promise<TimeSeriesPayload> => {
    const endpoint = StatisticsApi.alcohols.popularity.endpoint.replace(
      ':alcoholId',
      String(alcoholId)
    );
    const response = await apiClient.get<TimeSeriesPayload>(endpoint, { params });
    return response.data;
  },

  getAlcoholObservations: async (
    alcoholId: number,
    axis: StatisticsObservationAxis,
    params: AlcoholStatisticsParams
  ): Promise<TimeSeriesPayload> => {
    const endpoint = StatisticsApi.alcohols.observations.endpoint
      .replace(':alcoholId', String(alcoholId))
      .replace(':axis', axis);
    const response = await apiClient.get<TimeSeriesPayload>(endpoint, { params });
    return response.data;
  },
};
