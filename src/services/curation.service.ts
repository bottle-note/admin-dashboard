/**
 * 큐레이션 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  CurationApi,
  type CurationSearchParams,
  type CurationListItem,
  type CurationPageMeta,
  type CurationDetail,
  type CurationDetailResponse,
  type CurationCreateRequest,
  type CurationCreateResponse,
  type CurationUpdateRequest,
  type CurationUpdateResponse,
  type CurationDeleteResponse,
  type CurationToggleStatusRequest,
  type CurationToggleStatusResponse,
  type CurationUpdateDisplayOrderRequest,
  type CurationUpdateDisplayOrderResponse,
  type CurationAddAlcoholsRequest,
  type CurationAddAlcoholsResponse,
  type CurationRemoveAlcoholResponse,
  type CurationAlcoholItem,
} from '@/types/api';
import { adminAlcoholService } from './admin-alcohol.service';

// ============================================
// Query Keys
// ============================================

export const curationKeys = createQueryKeys('curations');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface CurationListResponse {
  items: CurationListItem[];
  meta: CurationPageMeta;
}

// ============================================
// 응답 변환 헬퍼
// ============================================

/**
 * API 응답을 UI용 CurationDetail로 변환
 * - alcoholIds → alcohols 배열로 변환 (상세 정보 포함)
 * - modifiedAt → updatedAt 매핑
 */
async function transformDetailResponse(response: CurationDetailResponse): Promise<CurationDetail> {
  // 연결된 위스키 상세 정보 병렬 조회
  let alcohols: CurationAlcoholItem[] = [];

  if (response.alcoholIds.length > 0) {
    const alcoholDetails = await Promise.all(
      response.alcoholIds.map((alcoholId) =>
        adminAlcoholService.getDetail(alcoholId).catch(() => null)
      )
    );

    alcohols = alcoholDetails
      .filter((detail): detail is NonNullable<typeof detail> => detail !== null)
      .map((detail) => ({
        alcoholId: detail.alcoholId,
        korName: detail.korName,
        engName: detail.engName,
        imageUrl: detail.imageUrl,
      }));
  }

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    coverImageUrl: response.coverImageUrl,
    displayOrder: response.displayOrder,
    isActive: response.isActive,
    createdAt: response.createdAt,
    updatedAt: response.modifiedAt, // API는 modifiedAt 사용
    alcoholCount: response.alcoholIds.length,
    alcohols,
  };
}

// ============================================
// Service
// ============================================

export const curationService = {
  /**
   * 큐레이션 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  search: async (params?: CurationSearchParams): Promise<CurationListResponse> => {
    const response = await apiClient.getWithMeta<CurationListItem[]>(
      CurationApi.search.endpoint,
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
   * 큐레이션 상세 조회
   * API 응답을 UI용 타입으로 변환하여 반환
   * 연결된 위스키의 상세 정보도 함께 조회
   */
  getDetail: async (curationId: number): Promise<CurationDetail> => {
    const endpoint = CurationApi.detail.endpoint.replace(':curationId', String(curationId));
    const response = await apiClient.get<CurationDetailResponse>(endpoint);
    return await transformDetailResponse(response);
  },

  /**
   * 큐레이션 생성
   */
  create: async (data: CurationCreateRequest): Promise<CurationCreateResponse> => {
    return apiClient.post<CurationCreateResponse, CurationCreateRequest>(
      CurationApi.create.endpoint,
      data
    );
  },

  /**
   * 큐레이션 수정
   */
  update: async (curationId: number, data: CurationUpdateRequest): Promise<CurationUpdateResponse> => {
    const endpoint = CurationApi.update.endpoint.replace(':curationId', String(curationId));
    return apiClient.put<CurationUpdateResponse, CurationUpdateRequest>(endpoint, data);
  },

  /**
   * 큐레이션 삭제
   */
  delete: async (curationId: number): Promise<CurationDeleteResponse> => {
    const endpoint = CurationApi.delete.endpoint.replace(':curationId', String(curationId));
    return apiClient.delete<CurationDeleteResponse>(endpoint);
  },

  /**
   * 큐레이션 활성화 상태 토글
   */
  toggleStatus: async (curationId: number, data: CurationToggleStatusRequest): Promise<CurationToggleStatusResponse> => {
    const endpoint = CurationApi.toggleStatus.endpoint.replace(':curationId', String(curationId));
    return apiClient.patch<CurationToggleStatusResponse, CurationToggleStatusRequest>(endpoint, data);
  },

  /**
   * 큐레이션 노출 순서 변경
   */
  updateDisplayOrder: async (curationId: number, data: CurationUpdateDisplayOrderRequest): Promise<CurationUpdateDisplayOrderResponse> => {
    const endpoint = CurationApi.updateDisplayOrder.endpoint.replace(':curationId', String(curationId));
    return apiClient.patch<CurationUpdateDisplayOrderResponse, CurationUpdateDisplayOrderRequest>(endpoint, data);
  },

  /**
   * 큐레이션 위스키 추가
   */
  addAlcohols: async (curationId: number, data: CurationAddAlcoholsRequest): Promise<CurationAddAlcoholsResponse> => {
    const endpoint = CurationApi.addAlcohols.endpoint.replace(':curationId', String(curationId));
    return apiClient.post<CurationAddAlcoholsResponse, CurationAddAlcoholsRequest>(endpoint, data);
  },

  /**
   * 큐레이션 위스키 제거 (단건)
   */
  removeAlcohol: async (curationId: number, alcoholId: number): Promise<CurationRemoveAlcoholResponse> => {
    const endpoint = CurationApi.removeAlcohol.endpoint
      .replace(':curationId', String(curationId))
      .replace(':alcoholId', String(alcoholId));
    return apiClient.delete<CurationRemoveAlcoholResponse>(endpoint);
  },

  /**
   * 큐레이션 위스키 벌크 제거
   * API가 단건만 지원하므로 병렬로 여러 번 호출
   */
  removeAlcohols: async (curationId: number, alcoholIds: number[]): Promise<void> => {
    await Promise.all(
      alcoholIds.map((alcoholId) =>
        curationService.removeAlcohol(curationId, alcoholId)
      )
    );
  },

  /**
   * 큐레이션 URL 생성
   * @param curationId - 큐레이션 ID
   * @returns 앱 내부 URL
   */
  generateCurationUrl: (curationId: number): string => {
    return `/alcohols/search?curationId=${curationId}`;
  },
};
