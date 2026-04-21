/**
 * Distillery API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  DistilleryApi,
  type DistillerySearchParams,
  type DistilleryListItem,
  type DistilleryPageMeta,
  type DistilleryDetail,
  type DistilleryFormData,
  type DistilleryFormResponse,
  type DistilleryDeleteResponse,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const distilleryKeys = createQueryKeys('distilleries');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface DistilleryListResponse {
  items: DistilleryListItem[];
  meta: DistilleryPageMeta;
}

// ============================================
// Service
// ============================================

export const distilleryService = {
  /**
   * 증류소 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  list: async (params?: DistillerySearchParams): Promise<DistilleryListResponse> => {
    const response = await apiClient.getWithMeta<DistilleryListItem[]>(
      DistilleryApi.list.endpoint,
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
   * 증류소 상세 조회
   */
  detail: async (id: number): Promise<DistilleryDetail> => {
    const endpoint = DistilleryApi.detail.endpoint.replace(':id', String(id));
    return apiClient.get<DistilleryDetail>(endpoint);
  },

  /**
   * 증류소 생성
   */
  create: async (data: DistilleryFormData): Promise<DistilleryFormResponse> => {
    return apiClient.post<DistilleryFormResponse, DistilleryFormData>(
      DistilleryApi.create.endpoint,
      data
    );
  },

  /**
   * 증류소 수정
   */
  update: async (id: number, data: DistilleryFormData): Promise<DistilleryFormResponse> => {
    const endpoint = DistilleryApi.update.endpoint.replace(':id', String(id));
    return apiClient.put<DistilleryFormResponse, DistilleryFormData>(endpoint, data);
  },

  /**
   * 증류소 삭제
   */
  delete: async (id: number): Promise<DistilleryDeleteResponse> => {
    const endpoint = DistilleryApi.delete.endpoint.replace(':id', String(id));
    return apiClient.delete<DistilleryDeleteResponse>(endpoint);
  },
};
