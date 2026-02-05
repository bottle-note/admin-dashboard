/**
 * 테이스팅 태그 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  TastingTagApi,
  type TastingTagSearchParams,
  type TastingTagListItem,
  type TastingTagPageMeta,
  type TastingTagFormData,
  type TastingTagFormResponse,
  type TastingTagDeleteResponse,
  type TastingTagDetail,
  type TastingTagAlcoholConnectionRequest,
  type TastingTagAlcoholConnectionResponse,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const tastingTagKeys = createQueryKeys('tasting-tags');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface TastingTagListResponse {
  items: TastingTagListItem[];
  meta: TastingTagPageMeta;
}

// ============================================
// Service
// ============================================

export const tastingTagService = {
  /**
   * 테이스팅 태그 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  list: async (params?: TastingTagSearchParams): Promise<TastingTagListResponse> => {
    const response = await apiClient.getWithMeta<TastingTagListItem[]>(
      TastingTagApi.list.endpoint,
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
   * 테이스팅 태그 생성
   */
  create: async (data: TastingTagFormData): Promise<TastingTagFormResponse> => {
    return apiClient.post<TastingTagFormResponse, TastingTagFormData>(
      TastingTagApi.create.endpoint,
      data
    );
  },

  /**
   * 테이스팅 태그 수정
   */
  update: async (id: number, data: TastingTagFormData): Promise<TastingTagFormResponse> => {
    const endpoint = TastingTagApi.update.endpoint.replace(':id', String(id));
    return apiClient.put<TastingTagFormResponse, TastingTagFormData>(endpoint, data);
  },

  /**
   * 테이스팅 태그 삭제
   */
  delete: async (id: number): Promise<TastingTagDeleteResponse> => {
    const endpoint = TastingTagApi.delete.endpoint.replace(':id', String(id));
    return apiClient.delete<TastingTagDeleteResponse>(endpoint);
  },

  /**
   * 테이스팅 태그 상세 조회
   */
  detail: async (id: number): Promise<TastingTagDetail> => {
    const endpoint = TastingTagApi.detail.endpoint.replace(':id', String(id));
    return apiClient.get<TastingTagDetail>(endpoint);
  },

  /**
   * 테이스팅 태그에 위스키 벌크 연결
   */
  connectAlcohols: async (tagId: number, alcoholIds: number[]): Promise<TastingTagAlcoholConnectionResponse> => {
    const endpoint = TastingTagApi.connectAlcohols.endpoint.replace(':id', String(tagId));
    return apiClient.post<TastingTagAlcoholConnectionResponse, TastingTagAlcoholConnectionRequest>(endpoint, { alcoholIds });
  },

  /**
   * 테이스팅 태그에서 위스키 벌크 연결 해제
   */
  disconnectAlcohols: async (tagId: number, alcoholIds: number[]): Promise<TastingTagAlcoholConnectionResponse> => {
    const endpoint = TastingTagApi.disconnectAlcohols.endpoint.replace(':id', String(tagId));
    return apiClient.delete<TastingTagAlcoholConnectionResponse>(endpoint, { data: { alcoholIds } });
  },
};
