/**
 * 배너 API 서비스
 * API 연동 전까지 Mock 데이터 사용
 */

import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  type BannerSearchParams,
  type BannerListItem,
  type BannerPageMeta,
  type BannerDetail,
  type BannerCreateRequest,
  type BannerCreateResponse,
  type BannerUpdateRequest,
  type BannerUpdateResponse,
  type BannerDeleteResponse,
  type BannerReorderRequest,
  type BannerReorderResponse,
} from '@/types/api';
import { mockBannerList, mockBannerDetails } from '@/data/mock/banners.mock';

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
// Mock 상태 관리 (실제 API 연동 시 제거)
// ============================================

let mockBanners = [...mockBannerList];
let mockDetails = { ...mockBannerDetails };
let nextId = Math.max(...mockBanners.map((b) => b.id)) + 1;

// ============================================
// Service
// ============================================

export const bannerService = {
  /**
   * 배너 목록 조회
   * Mock: 필터링, 검색, 페이지네이션 시뮬레이션
   */
  search: async (params?: BannerSearchParams): Promise<BannerListResponse> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // const response = await apiClient.getWithMeta<BannerListItem[]>(
    //   BannerApi.search.endpoint,
    //   { params }
    // );
    // return {
    //   items: response.data ?? [],
    //   meta: {
    //     page: response.meta.page ?? params?.page ?? 0,
    //     size: response.meta.size ?? params?.size ?? 20,
    //     totalElements: response.meta.totalElements ?? 0,
    //     totalPages: response.meta.totalPages ?? 0,
    //     hasNext: response.meta.hasNext ?? false,
    //   },
    // };

    // Mock 구현
    await delay(300);

    let filtered = [...mockBanners];

    // 검색어 필터
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(keyword)
      );
    }

    // 배너 타입 필터
    if (params?.bannerType) {
      filtered = filtered.filter((b) => b.bannerType === params.bannerType);
    }

    // 활성화 상태 필터
    if (params?.isActive !== undefined) {
      filtered = filtered.filter((b) => b.isActive === params.isActive);
    }

    // 정렬 (sortOrder 기준)
    filtered.sort((a, b) => a.sortOrder - b.sortOrder);

    // 페이지네이션
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const start = page * size;
    const end = start + size;
    const paginatedItems = filtered.slice(start, end);

    return {
      items: paginatedItems,
      meta: {
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        hasNext: end < filtered.length,
      },
    };
  },

  /**
   * 배너 상세 조회
   */
  getDetail: async (bannerId: number): Promise<BannerDetail> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // const endpoint = BannerApi.detail.endpoint.replace(':bannerId', String(bannerId));
    // return apiClient.get<BannerDetail>(endpoint);

    // Mock 구현
    await delay(200);

    const detail = mockDetails[bannerId];
    if (!detail) {
      throw new Error(`Banner not found: ${bannerId}`);
    }

    return detail;
  },

  /**
   * 배너 생성
   */
  create: async (data: BannerCreateRequest): Promise<BannerCreateResponse> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // return apiClient.post<BannerCreateResponse, BannerCreateRequest>(
    //   BannerApi.create.endpoint,
    //   data
    // );

    // Mock 구현
    await delay(300);

    const newId = nextId++;
    const now = new Date().toISOString();
    const maxSortOrder = Math.max(...mockBanners.map((b) => b.sortOrder), -1);

    const newBanner: BannerListItem = {
      id: newId,
      name: data.name,
      bannerType: data.bannerType,
      imageUrl: data.imageUrl,
      sortOrder: maxSortOrder + 1,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdAt: now,
      updatedAt: now,
    };

    const newDetail: BannerDetail = {
      ...data,
      id: newId,
      sortOrder: maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    mockBanners.push(newBanner);
    mockDetails[newId] = newDetail;

    return {
      code: 'SUCCESS',
      message: '배너가 등록되었습니다.',
      targetId: newId,
      responseAt: now,
    };
  },

  /**
   * 배너 수정
   */
  update: async (bannerId: number, data: BannerUpdateRequest): Promise<BannerUpdateResponse> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // const endpoint = BannerApi.update.endpoint.replace(':bannerId', String(bannerId));
    // return apiClient.put<BannerUpdateResponse, BannerUpdateRequest>(endpoint, data);

    // Mock 구현
    await delay(300);

    const now = new Date().toISOString();
    const index = mockBanners.findIndex((b) => b.id === bannerId);

    if (index === -1) {
      throw new Error(`Banner not found: ${bannerId}`);
    }

    const existingBanner = mockBanners[index];
    const existingDetail = mockDetails[bannerId];

    if (!existingBanner || !existingDetail) {
      throw new Error(`Banner detail not found: ${bannerId}`);
    }

    // 목록 아이템 업데이트
    mockBanners[index] = {
      id: existingBanner.id,
      name: data.name,
      bannerType: data.bannerType,
      imageUrl: data.imageUrl,
      sortOrder: existingBanner.sortOrder,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdAt: existingBanner.createdAt,
      updatedAt: now,
    };

    // 상세 정보 업데이트
    mockDetails[bannerId] = {
      ...data,
      id: bannerId,
      sortOrder: existingDetail.sortOrder,
      createdAt: existingDetail.createdAt,
      updatedAt: now,
    };

    return {
      code: 'SUCCESS',
      message: '배너가 수정되었습니다.',
      targetId: bannerId,
      responseAt: now,
    };
  },

  /**
   * 배너 삭제
   */
  delete: async (bannerId: number): Promise<BannerDeleteResponse> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // const endpoint = BannerApi.delete.endpoint.replace(':bannerId', String(bannerId));
    // return apiClient.delete<BannerDeleteResponse>(endpoint);

    // Mock 구현
    await delay(300);

    const index = mockBanners.findIndex((b) => b.id === bannerId);

    if (index === -1) {
      throw new Error(`Banner not found: ${bannerId}`);
    }

    mockBanners.splice(index, 1);
    delete mockDetails[bannerId];

    return {
      code: 'SUCCESS',
      message: '배너가 삭제되었습니다.',
      targetId: bannerId,
      responseAt: new Date().toISOString(),
    };
  },

  /**
   * 배너 순서 변경
   */
  reorder: async (data: BannerReorderRequest): Promise<BannerReorderResponse> => {
    // TODO: 실제 API 연동 시 아래 코드로 교체
    // return apiClient.put<BannerReorderResponse, BannerReorderRequest>(
    //   BannerApi.reorder.endpoint,
    //   data
    // );

    // Mock 구현
    await delay(300);

    const now = new Date().toISOString();

    // 순서 업데이트
    data.bannerIds.forEach((id, newSortOrder) => {
      const bannerIndex = mockBanners.findIndex((b) => b.id === id);
      const existing = bannerIndex !== -1 ? mockBanners[bannerIndex] : undefined;
      if (existing) {
        mockBanners[bannerIndex] = {
          id: existing.id,
          name: existing.name,
          bannerType: existing.bannerType,
          imageUrl: existing.imageUrl,
          sortOrder: newSortOrder,
          startDate: existing.startDate,
          endDate: existing.endDate,
          isActive: existing.isActive,
          createdAt: existing.createdAt,
          updatedAt: now,
        };
      }
      const detail = mockDetails[id];
      if (detail) {
        mockDetails[id] = {
          ...detail,
          sortOrder: newSortOrder,
          updatedAt: now,
        };
      }
    });

    // 정렬
    mockBanners.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      code: 'SUCCESS',
      message: '배너 순서가 변경되었습니다.',
      responseAt: now,
    };
  },
};

// ============================================
// 유틸리티
// ============================================

/**
 * Mock API 딜레이 시뮬레이션
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 개발용: Mock 데이터 리셋
export function resetMockBanners(): void {
  mockBanners = [...mockBannerList];
  mockDetails = { ...mockBannerDetails };
  nextId = Math.max(...mockBanners.map((b) => b.id)) + 1;
}
