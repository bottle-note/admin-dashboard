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
};
