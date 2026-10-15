/**
 * 위스키 속성 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  AlcoholAttributeApi,
  type AlcoholAttributeBatchDeleteRequest,
  type AlcoholAttributeCreateRequest,
  type AlcoholAttributeCreateResponse,
  type AlcoholAttributeEnums,
  type AlcoholAttributeKeyStat,
  type AlcoholAttributeKeywordCount,
  type AlcoholAttributeResultResponse,
  type AlcoholAttributeRow,
  type AlcoholAttributeSummaryItem,
  type AlcoholAttributeUpdateRequest,
  type AttributedAlcoholListResponse,
  type AttributedAlcoholPageMeta,
  type AttributedAlcoholSearchParams,
  type AttributedAlcoholItem,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

const baseKeys = createQueryKeys('alcohol-attributes');

/** 선택 위스키가 바뀌면 키도 바뀌도록 id 목록을 정렬해 문자열로 만든다 */
function idsKey(alcoholIds: number[]) {
  return [...alcoholIds].sort((a, b) => a - b).join(',');
}

export const alcoholAttributeKeys = {
  ...baseKeys,
  rows: (alcoholIds: number[]) => [...baseKeys.all, 'rows', idsKey(alcoholIds)] as const,
  summary: (alcoholIds: number[]) => [...baseKeys.all, 'summary', idsKey(alcoholIds)] as const,
  alcohols: (params: AttributedAlcoholSearchParams) =>
    [...baseKeys.all, 'alcohols', params] as const,
  keywords: () => [...baseKeys.all, 'keywords'] as const,
  keyStats: () => [...baseKeys.all, 'keys'] as const,
  enums: () => [...baseKeys.all, 'enums'] as const,
};

// ============================================
// Service
// ============================================

function withId(endpoint: string, id: number) {
  return endpoint.replace(':id', String(id));
}

export const alcoholAttributeService = {
  /** 선택한 위스키의 속성 행 */
  list: async (alcoholIds: number[]): Promise<AlcoholAttributeRow[]> => {
    const response = await apiClient.get<AlcoholAttributeRow[]>(AlcoholAttributeApi.list.endpoint, {
      params: { alcoholIds: alcoholIds.join(',') },
    });
    return response.data;
  },

  /** 선택한 위스키의 속성 묶음 요약 */
  summary: async (alcoholIds: number[]): Promise<AlcoholAttributeSummaryItem[]> => {
    const response = await apiClient.get<AlcoholAttributeSummaryItem[]>(
      AlcoholAttributeApi.summary.endpoint,
      { params: { alcoholIds: alcoholIds.join(',') } }
    );
    return response.data;
  },

  /** 속성이 붙은 위스키 목록 (페이지) */
  attributedAlcohols: async (
    params: AttributedAlcoholSearchParams
  ): Promise<AttributedAlcoholListResponse> => {
    const response = await apiClient.get<AttributedAlcoholItem[], AttributedAlcoholPageMeta>(
      AlcoholAttributeApi.attributedAlcohols.endpoint,
      { params }
    );
    return { items: response.data, meta: response.meta };
  },

  /** 여러 위스키에 같은 속성 추가 */
  create: (data: AlcoholAttributeCreateRequest): Promise<AlcoholAttributeCreateResponse> => {
    return apiClient.post<AlcoholAttributeCreateResponse, AlcoholAttributeCreateRequest>(
      AlcoholAttributeApi.create.endpoint,
      data
    );
  },

  /** 속성 한 건 수정 */
  update: (
    id: number,
    data: AlcoholAttributeUpdateRequest
  ): Promise<AlcoholAttributeResultResponse> => {
    return apiClient.put<AlcoholAttributeResultResponse, AlcoholAttributeUpdateRequest>(
      withId(AlcoholAttributeApi.update.endpoint, id),
      data
    );
  },

  /** 속성 한 건 삭제 */
  delete: (id: number): Promise<AlcoholAttributeResultResponse> => {
    return apiClient.delete<AlcoholAttributeResultResponse>(
      withId(AlcoholAttributeApi.delete.endpoint, id)
    );
  },

  /** 속성 여러 건 삭제. 지운 행을 돌려준다 */
  batchDelete: (ids: number[]): Promise<AlcoholAttributeRow[]> => {
    return apiClient.post<AlcoholAttributeRow[], AlcoholAttributeBatchDeleteRequest>(
      AlcoholAttributeApi.batchDelete.endpoint,
      { ids }
    );
  },

  /** 키워드 값과 사용 위스키 수 */
  keywords: async (): Promise<AlcoholAttributeKeywordCount[]> => {
    const response = await apiClient.get<AlcoholAttributeKeywordCount[]>(
      AlcoholAttributeApi.keywords.endpoint
    );
    return response.data;
  },

  /** 항목별 집계 */
  keyStats: async (): Promise<AlcoholAttributeKeyStat[]> => {
    const response = await apiClient.get<AlcoholAttributeKeyStat[]>(
      AlcoholAttributeApi.keys.endpoint
    );
    return response.data;
  },

  /** 화면 라벨 */
  enums: async (): Promise<AlcoholAttributeEnums> => {
    const response = await apiClient.get<AlcoholAttributeEnums>(AlcoholAttributeApi.enums.endpoint);
    return response.data;
  },
};
