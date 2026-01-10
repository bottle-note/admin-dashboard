/**
 * 어드민 Alcohol API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  AlcoholApi,
  type AlcoholSearchParams,
  type AlcoholListItem,
  type AlcoholPageMeta,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const adminAlcoholKeys = createQueryKeys('admin-alcohols');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface AlcoholListResponse {
  items: AlcoholListItem[];
  meta: AlcoholPageMeta;
}

// ============================================
// Service
// ============================================

export const adminAlcoholService = {
  /**
   * 술 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  search: async (params?: AlcoholSearchParams): Promise<AlcoholListResponse> => {
    const response = await apiClient.getWithMeta<AlcoholListItem[]>(
      AlcoholApi.search.endpoint,
      { params }
    );

    // data는 배열, meta에 페이지 정보 직접 포함
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
