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
  type AlcoholDetail,
  type AlcoholCreateRequest,
  type AlcoholCreateResponse,
  type AlcoholDeleteResponse,
  type AlcoholUpdateRequest,
  type AlcoholUpdateResponse,
  type CategoryReference,
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

  /**
   * 술 상세 조회
   */
  getDetail: async (alcoholId: number): Promise<AlcoholDetail> => {
    const endpoint = AlcoholApi.detail.endpoint.replace(':alcoholId', String(alcoholId));
    return apiClient.get<AlcoholDetail>(endpoint);
  },

  /**
   * 술 생성
   */
  create: async (data: AlcoholCreateRequest): Promise<AlcoholCreateResponse> => {
    return apiClient.post<AlcoholCreateResponse, AlcoholCreateRequest>(
      AlcoholApi.create.endpoint,
      data
    );
  },

  /**
   * 카테고리 레퍼런스 조회
   * DB에 등록된 모든 카테고리 페어(한글/영문) 목록 조회
   */
  getCategoryReferences: async (): Promise<CategoryReference[]> => {
    return apiClient.get<CategoryReference[]>(AlcoholApi.categoryReference.endpoint);
  },

  /**
   * 술 삭제
   * 소프트 삭제로 처리되며, 리뷰/평점이 있는 술은 삭제 불가
   */
  delete: async (alcoholId: number): Promise<AlcoholDeleteResponse> => {
    const endpoint = AlcoholApi.delete.endpoint.replace(':alcoholId', String(alcoholId));
    return apiClient.delete<AlcoholDeleteResponse>(endpoint);
  },

  /**
   * 술 수정
   * 전체 수정(PUT)이므로 모든 필드를 전달해야 함
   * 이미 삭제된 술은 수정 불가
   */
  update: async (alcoholId: number, data: AlcoholUpdateRequest): Promise<AlcoholUpdateResponse> => {
    const endpoint = AlcoholApi.update.endpoint.replace(':alcoholId', String(alcoholId));
    return apiClient.put<AlcoholUpdateResponse, AlcoholUpdateRequest>(endpoint, data);
  },
};
