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
  type PaginatedData,
  type Pageable,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const helpKeys = createQueryKeys('helps');

// ============================================
// Service
// ============================================

export const helpService = {
  /**
   * 문의 목록 조회
   * 커서 기반 페이지네이션
   */
  getList: async (
    params?: HelpListParams
  ): Promise<PaginatedData<HelpListItem>> => {
    const response = await apiClient.getWithMeta<{
      content: {
        totalCount: number;
        helpList: HelpListItem[];
      };
      cursorPageable: Pageable;
    }>(HelpApi.list.endpoint, { params });

    const data = response.data;

    return {
      items: data.content?.helpList ?? [],
      pageable: data.cursorPageable ?? {
        currentCursor: 0,
        cursor: 0,
        pageSize: params?.pageSize ?? 20,
        hasNext: false,
      },
      totalCount: data.content?.totalCount ?? 0,
    };
  },

  /**
   * 문의 상세 조회
   */
  getDetail: async (helpId: number): Promise<HelpDetail> => {
    return apiClient.get<HelpDetail>(HelpApi.detail.endpoint(helpId));
  },

  /**
   * 문의 답변 등록
   */
  answer: async (
    helpId: number,
    body: HelpAnswerRequest
  ): Promise<HelpAnswerResponse> => {
    return apiClient.post<HelpAnswerResponse, HelpAnswerRequest>(
      HelpApi.answer.endpoint(helpId),
      body
    );
  },
};
