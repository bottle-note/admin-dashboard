/**
 * 리뷰 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  ReviewApi,
  type ReviewSearchParams,
  type ReviewListItem,
  type ReviewPageMeta,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const reviewKeys = createQueryKeys('reviews');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface ReviewListResponse {
  items: ReviewListItem[];
  meta: ReviewPageMeta;
}

// ============================================
// Service
// ============================================

export const reviewService = {
  /**
   * 리뷰 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  list: async (params?: ReviewSearchParams): Promise<ReviewListResponse> => {
    const response = await apiClient.getWithMeta<ReviewListItem[]>(
      ReviewApi.list.endpoint,
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
