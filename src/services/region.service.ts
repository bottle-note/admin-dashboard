/**
 * Region API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  RegionApi,
  type RegionSearchParams,
  type RegionListItem,
  type RegionPageMeta,
  type RegionDetail,
  type RegionFormData,
  type RegionFormResponse,
  type RegionDeleteResponse,
  type RegionSortOrderRequest,
  type RegionSortOrderResponse,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const regionKeys = createQueryKeys('regions');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface RegionListResponse {
  items: RegionListItem[];
  meta: RegionPageMeta;
}

// ============================================
// Service
// ============================================

export const regionService = {
  /**
   * 지역 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  list: async (params?: RegionSearchParams): Promise<RegionListResponse> => {
    const response = await apiClient.getWithMeta<RegionListItem[]>(
      RegionApi.list.endpoint,
      { params }
    );

    return {
      items: response.data ?? [],
      meta: {
        page: response.meta.page ?? params?.page ?? 0,
        size: response.meta.size ?? params?.size ?? 20,
        totalElements: response.meta.totalElements ?? 0,
        totalPages: response.meta.totalPages ?? 0,
        hasNext: response.meta.hasNext ?? false,
      },
    };
  },

  /**
   * 지역 상세 조회
   */
  detail: async (id: number): Promise<RegionDetail> => {
    const endpoint = RegionApi.detail.endpoint.replace(':id', String(id));
    return apiClient.get<RegionDetail>(endpoint);
  },

  /**
   * 지역 생성
   */
  create: async (data: RegionFormData): Promise<RegionFormResponse> => {
    return apiClient.post<RegionFormResponse, RegionFormData>(
      RegionApi.create.endpoint,
      data
    );
  },

  /**
   * 지역 수정
   */
  update: async (id: number, data: RegionFormData): Promise<RegionFormResponse> => {
    const endpoint = RegionApi.update.endpoint.replace(':id', String(id));
    return apiClient.put<RegionFormResponse, RegionFormData>(endpoint, data);
  },

  /**
   * 지역 삭제
   */
  delete: async (id: number): Promise<RegionDeleteResponse> => {
    const endpoint = RegionApi.delete.endpoint.replace(':id', String(id));
    return apiClient.delete<RegionDeleteResponse>(endpoint);
  },

  /**
   * 지역 정렬 순서 변경
   */
  updateSortOrder: async (
    id: number,
    data: RegionSortOrderRequest
  ): Promise<RegionSortOrderResponse> => {
    const endpoint = RegionApi.updateSortOrder.endpoint.replace(':id', String(id));
    return apiClient.patch<RegionSortOrderResponse, RegionSortOrderRequest>(
      endpoint,
      data
    );
  },
};
