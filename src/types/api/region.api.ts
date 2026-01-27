/**
 * Region API 타입 정의
 * 어드민 지역(국가) 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const RegionApi = {
  /** 지역 목록 조회 */
  list: {
    endpoint: '/admin/api/v1/regions',
    method: 'GET',
  },
} as const;

// ============================================
// API 타입 정의
// ============================================

export interface RegionApiTypes {
  /** 지역 목록 조회 */
  list: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 */
      keyword?: string;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
      /** 정렬 방향 (기본값: ASC) */
      sortOrder?: 'ASC' | 'DESC';
    };
    /** 응답 아이템 */
    response: {
      /** 지역 ID */
      id: number;
      /** 국가 한글명 */
      korName: string;
      /** 국가 영문명 */
      engName: string;
      /** 대륙 */
      continent: string;
      /** 설명 */
      description: string | null;
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

/** 지역 목록 조회 파라미터 */
export type RegionSearchParams = RegionApiTypes['list']['params'];

/** 지역 목록 아이템 */
export type RegionListItem = RegionApiTypes['list']['response'];

/** 지역 목록 페이지네이션 메타 */
export type RegionPageMeta = RegionApiTypes['list']['meta'];
