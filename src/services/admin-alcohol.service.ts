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
   * 페이지 기반 페이지네이션
   */
  search: async (params?: AlcoholSearchParams): Promise<AlcoholListResponse> => {
    const response = await apiClient.getWithMeta<AlcoholListItem[]>(
      AlcoholApi.search.endpoint,
      { params }
    );

    // API 응답의 meta.pageable에서 페이지네이션 정보 추출
    const pageable = response.meta?.pageable;

    return {
      items: response.data,
      meta: {
        page: pageable?.currentCursor ?? 0,
        size: pageable?.pageSize ?? 20,
        totalElements: 0, // API 응답에서 제공되면 업데이트
        totalPages: 0,
        hasNext: pageable?.hasNext ?? false,
      },
    };
  },
};
