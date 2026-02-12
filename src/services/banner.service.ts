/**
 * 배너 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  BannerApi,
  type BannerSearchParams,
  type BannerListItem,
  type BannerPageMeta,
  type BannerDetail,
  type BannerCreateRequest,
  type BannerCreateResponse,
  type BannerUpdateRequest,
  type BannerUpdateResponse,
  type BannerDeleteResponse,
  type BannerUpdateStatusRequest,
  type BannerUpdateStatusResponse,
  type BannerUpdateSortOrderRequest,
  type BannerUpdateSortOrderResponse,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const bannerKeys = createQueryKeys('banners');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface BannerListResponse {
  items: BannerListItem[];
  meta: BannerPageMeta;
}

// ============================================
// Service
// ============================================

export const bannerService = {
  /**
   * 배너 목록 조회
   */
  search: async (params?: BannerSearchParams): Promise<BannerListResponse> => {
    const response = await apiClient.getWithMeta<BannerListItem[]>(
      BannerApi.search.endpoint,
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
   * 배너 상세 조회
   */
  getDetail: async (bannerId: number): Promise<BannerDetail> => {
    const endpoint = BannerApi.detail.endpoint.replace(':bannerId', String(bannerId));
    return apiClient.get<BannerDetail>(endpoint);
  },

  /**
   * 배너 생성
   */
  create: async (data: BannerCreateRequest): Promise<BannerCreateResponse> => {
    return apiClient.post<BannerCreateResponse, BannerCreateRequest>(
      BannerApi.create.endpoint,
      data
    );
  },

  /**
   * 배너 수정
   */
  update: async (bannerId: number, data: BannerUpdateRequest): Promise<BannerUpdateResponse> => {
    const endpoint = BannerApi.update.endpoint.replace(':bannerId', String(bannerId));
    return apiClient.put<BannerUpdateResponse, BannerUpdateRequest>(endpoint, data);
  },

  /**
   * 배너 삭제
   */
  delete: async (bannerId: number): Promise<BannerDeleteResponse> => {
    const endpoint = BannerApi.delete.endpoint.replace(':bannerId', String(bannerId));
    return apiClient.delete<BannerDeleteResponse>(endpoint);
  },

  /**
   * 배너 상태 변경 (활성/비활성)
   */
  updateStatus: async (bannerId: number, data: BannerUpdateStatusRequest): Promise<BannerUpdateStatusResponse> => {
    const endpoint = BannerApi.updateStatus.endpoint.replace(':bannerId', String(bannerId));
    return apiClient.patch<BannerUpdateStatusResponse, BannerUpdateStatusRequest>(endpoint, data);
  },

  /**
   * 배너 정렬순서 변경
   */
  updateSortOrder: async (bannerId: number, data: BannerUpdateSortOrderRequest): Promise<BannerUpdateSortOrderResponse> => {
    const endpoint = BannerApi.updateSortOrder.endpoint.replace(':bannerId', String(bannerId));
    return apiClient.patch<BannerUpdateSortOrderResponse, BannerUpdateSortOrderRequest>(endpoint, data);
  },
};
