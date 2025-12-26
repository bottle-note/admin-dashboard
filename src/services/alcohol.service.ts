/**
 * 주류(Alcohol) API 서비스
 * API 공통 레이어 사용 예시
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import type {
  CursorPaginationParams,
  PaginatedData,
  AlcoholSortType,
  SortDirection,
  WhiskyCategory,
  PickStatus,
} from '@/types/api';

// ============================================
// Types - Request
// ============================================

/**
 * 주류 검색 파라미터
 */
export interface AlcoholSearchParams extends CursorPaginationParams {
  keyword?: string;
  category?: WhiskyCategory;
  regionId?: number;
  curationId?: number;
  sortType?: AlcoholSortType;
  sortOrder?: SortDirection;
}

/**
 * 주류 생성 요청
 */
export interface CreateAlcoholDto {
  korName: string;
  engName: string;
  category: WhiskyCategory;
  regionId: number;
  abv: number;
  description?: string;
  distillery?: string;
  cask?: string;
  imageUrl?: string;
}

/**
 * 주류 수정 요청
 */
export interface UpdateAlcoholDto extends Partial<CreateAlcoholDto> {}

/**
 * 찜하기 요청
 */
export interface PickAlcoholDto {
  alcoholId: number;
  isPicked: PickStatus;
}

// ============================================
// Types - Response
// ============================================

/**
 * 주류 목록 아이템
 */
export interface AlcoholListItem {
  alcoholId: number;
  korName: string;
  engName: string;
  korCategoryName: string;
  engCategoryName: string;
  imageUrl: string | null;
  rating: number;
  ratingCount: number;
  reviewCount: number;
  pickCount: number;
  isPicked: boolean;
}

/**
 * 주류 상세
 */
export interface AlcoholDetail {
  alcoholId: number;
  alcoholUrlImg: string | null;
  korName: string;
  engName: string;
  korCategory: string;
  engCategory: string;
  korRegion: string;
  engRegion: string;
  cask: string | null;
  abv: string;
  korDistillery: string | null;
  engDistillery: string | null;
  rating: number;
  totalRatingsCount: number;
  myRating: number | null;
  myAvgRating: number | null;
  isPicked: boolean;
  alcoholsTastingTags: string[];
}

/**
 * 찜하기 응답
 */
export interface PickResponse {
  message: string;
  status: PickStatus;
}

// ============================================
// Query Keys
// ============================================

/**
 * 주류 관련 Query Key 팩토리
 *
 * @example
 * ```ts
 * alcoholKeys.all          // ['alcohols']
 * alcoholKeys.lists()      // ['alcohols', 'list']
 * alcoholKeys.list(params) // ['alcohols', 'list', params]
 * alcoholKeys.detail(1)    // ['alcohols', 'detail', 1]
 * ```
 */
export const alcoholKeys = createQueryKeys('alcohols');

// ============================================
// Service
// ============================================

/**
 * 주류 API 서비스
 */
export const alcoholService = {
  /**
   * 주류 목록 검색
   */
  async search(params: AlcoholSearchParams = {}): Promise<PaginatedData<AlcoholListItem>> {
    const response = await apiClient.getWithMeta<AlcoholListItem[]>(
      '/api/v1/alcohols/search',
      { params }
    );

    return {
      items: response.data,
      pageable: response.meta.pageable!,
    };
  },

  /**
   * 주류 상세 조회
   */
  async getById(id: number): Promise<AlcoholDetail> {
    const response = await apiClient.get<{ alcohols: AlcoholDetail }>(
      `/api/v1/alcohols/${id}`
    );
    return response.alcohols;
  },

  /**
   * 주류 등록 (어드민)
   */
  async create(data: CreateAlcoholDto): Promise<AlcoholListItem> {
    return apiClient.post<AlcoholListItem>('/api/v1/admin/alcohols', data);
  },

  /**
   * 주류 수정 (어드민)
   */
  async update(id: number, data: UpdateAlcoholDto): Promise<AlcoholListItem> {
    return apiClient.patch<AlcoholListItem>(`/api/v1/admin/alcohols/${id}`, data);
  },

  /**
   * 주류 삭제 (어드민)
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/v1/admin/alcohols/${id}`);
  },

  /**
   * 주류 찜하기/찜하기 해제
   */
  async pick(data: PickAlcoholDto): Promise<PickResponse> {
    return apiClient.put<PickResponse>('/api/v1/picks', data);
  },
};

// ============================================
// Custom Hooks (Optional - 예시)
// ============================================

// 아래는 컴포넌트에서 직접 정의하거나, 별도 hooks 파일로 분리 가능

/*
import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useInfiniteApiQuery } from '@/hooks/useInfiniteApiQuery';
import { useQueryClient } from '@tanstack/react-query';

// 주류 목록 조회 훅
export function useAlcoholList(params: AlcoholSearchParams = {}) {
  return useApiQuery(
    alcoholKeys.list(params),
    () => alcoholService.search(params)
  );
}

// 주류 무한 스크롤 훅
export function useInfiniteAlcoholList(params: Omit<AlcoholSearchParams, 'cursor'> = {}) {
  return useInfiniteApiQuery(
    alcoholKeys.list(params),
    (cursor) => alcoholService.search({ ...params, cursor })
  );
}

// 주류 상세 조회 훅
export function useAlcohol(id: number) {
  return useApiQuery(
    alcoholKeys.detail(id),
    () => alcoholService.getById(id),
    { enabled: !!id }
  );
}

// 주류 생성 훅
export function useCreateAlcohol() {
  const queryClient = useQueryClient();

  return useApiMutation(alcoholService.create, {
    successMessage: '주류가 등록되었습니다.',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alcoholKeys.lists() });
    },
  });
}

// 주류 삭제 훅
export function useDeleteAlcohol() {
  const queryClient = useQueryClient();

  return useApiMutation(alcoholService.delete, {
    successMessage: '주류가 삭제되었습니다.',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alcoholKeys.lists() });
    },
  });
}

// 찜하기 훅
export function usePickAlcohol() {
  const queryClient = useQueryClient();

  return useApiMutation(alcoholService.pick, {
    onSuccess: (_, variables) => {
      // 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: alcoholKeys.detail(variables.alcoholId) });
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: alcoholKeys.lists() });
    },
  });
}
*/
