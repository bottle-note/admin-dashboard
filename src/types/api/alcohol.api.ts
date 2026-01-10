/**
 * Alcohol API 타입 정의
 * 어드민 술(Alcohol) 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const AlcoholApi = {
  /** 술 목록 조회 */
  search: {
    endpoint: '/admin/api/v1/alcohols',
    method: 'GET',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 카테고리 타입 */
export type AlcoholCategory =
  | 'SINGLE_MALT'
  | 'BLEND'
  | 'BLENDED_MALT'
  | 'BOURBON'
  | 'RYE'
  | 'OTHER';

/** 어드민 술 정렬 기준 */
export type AdminAlcoholSortType =
  | 'KOR_NAME'
  | 'ENG_NAME'
  | 'KOR_CATEGORY'
  | 'ENG_CATEGORY';

/** 정렬 방향 */
export type SortOrder = 'ASC' | 'DESC';

// ============================================
// API 타입 정의
// ============================================

export interface AlcoholApiTypes {
  /** 술 목록 조회 */
  search: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 (한글/영문 이름 검색) */
      keyword?: string;
      /** 카테고리 필터 */
      category?: AlcoholCategory;
      /** 지역 ID 필터 */
      regionId?: number;
      /** 정렬 기준 (기본값: KOR_NAME) */
      sortType?: AdminAlcoholSortType;
      /** 정렬 방향 (기본값: ASC) */
      sortOrder?: SortOrder;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 술 ID */
      alcoholId: number;
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 카테고리 한글명 */
      korCategoryName: string;
      /** 카테고리 영문명 */
      engCategoryName: string;
      /** 이미지 URL */
      imageUrl: string | null;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      modifiedAt: string;
    };
    /** 페이지네이션 메타 정보 */
    meta: {
      /** 현재 페이지 */
      page: number;
      /** 페이지 크기 */
      size: number;
      /** 전체 요소 수 */
      totalElements: number;
      /** 전체 페이지 수 */
      totalPages: number;
      /** 다음 페이지 존재 여부 */
      hasNext: boolean;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 술 목록 조회 파라미터 */
export type AlcoholSearchParams = AlcoholApiTypes['search']['params'];

/** 술 목록 아이템 */
export type AlcoholListItem = AlcoholApiTypes['search']['response'];

/** 술 목록 페이지네이션 메타 */
export type AlcoholPageMeta = AlcoholApiTypes['search']['meta'];
