/**
 * Help(문의) API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  HelpApi,
  type HelpListParams,
  type HelpListItem,
  type HelpDetail,
  type HelpAnswerRequest,
  type HelpAnswerResponse,
  type HelpListMeta,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const helpKeys = createQueryKeys('helps');

export interface HelpListResponse {
  items: HelpListItem[];
  meta: HelpListMeta;
}

// ============================================
// Service
// ============================================

export const helpService = {
  /**
   * 문의 목록 조회
   * 페이지 기반 페이지네이션
   */
  getList: async (params?: HelpListParams): Promise<HelpListResponse> => {
    const response = await apiClient.get<HelpListItem[]>(HelpApi.list.endpoint, { params });
    const page = response.meta.page ?? params?.page ?? 0;
    const size = response.meta.size ?? params?.size ?? 20;
    const totalPages = response.meta.totalPages ?? 0;

    return {
      items: response.data ?? [],
      meta: {
        page,
        size,
        totalElements: response.meta.totalElements ?? 0,
        totalPages,
        hasNext: response.meta.hasNext ?? page + 1 < totalPages,
      },
    };
  },

  /**
   * 문의 상세 조회
   */
  getDetail: async (helpId: number): Promise<HelpDetail> => {
    const response = await apiClient.get<HelpDetail>(HelpApi.detail.endpoint(helpId));
    return response.data;
  },

  /**
   * 문의 답변 등록
   */
  answer: async (helpId: number, body: HelpAnswerRequest): Promise<HelpAnswerResponse> => {
    return apiClient.post<HelpAnswerResponse, HelpAnswerRequest>(
      HelpApi.answer.endpoint(helpId),
      body
    );
  },
};
