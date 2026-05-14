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
  /** 지역 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/regions/:id',
    method: 'GET',
  },
  /** 지역 생성 */
  create: {
    endpoint: '/admin/api/v1/regions',
    method: 'POST',
  },
  /** 지역 수정 */
  update: {
    endpoint: '/admin/api/v1/regions/:id',
    method: 'PUT',
  },
  /** 지역 삭제 */
  delete: {
    endpoint: '/admin/api/v1/regions/:id',
    method: 'DELETE',
  },
  /** 지역 정렬 순서 변경 */
  updateSortOrder: {
    endpoint: '/admin/api/v1/regions/:id/sort-order',
    method: 'PATCH',
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
      /** 부모 지역 ID (최상위 지역은 null) */
      parentId: number | null;
      /** 정렬 순서 (미설정: 9999) */
      sortOrder: number;
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
  /** 지역 상세 조회 */
  detail: {
    /** 응답 */
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
      /** 부모 지역 ID (최상위 지역은 null) */
      parentId: number | null;
      /** 정렬 순서 (미설정: 9999) */
      sortOrder: number;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      modifiedAt: string;
    };
  };
  /** 지역 생성/수정 요청 */
  form: {
    /** 요청 데이터 */
    request: {
      /** 국가 한글명 */
      korName: string;
      /** 국가 영문명 */
      engName: string;
      /** 대륙 */
      continent?: string | null;
      /** 설명 */
      description?: string | null;
      /** 부모 지역 ID (최상위 지역은 null) */
      parentId?: number | null;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 생성/수정된 지역 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 지역 삭제 */
  delete: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 삭제된 지역 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 지역 정렬 순서 변경 */
  updateSortOrder: {
    /** 요청 데이터 */
    request: {
      /** 정렬 순서 (0 이상) */
      sortOrder: number;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 대상 지역 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
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

/** 지역 상세 */
export type RegionDetail = RegionApiTypes['detail']['response'];

/** 지역 폼 데이터 (생성/수정) */
export type RegionFormData = RegionApiTypes['form']['request'];

/** 지역 생성/수정 응답 */
export type RegionFormResponse = RegionApiTypes['form']['response'];

/** 지역 삭제 응답 */
export type RegionDeleteResponse = RegionApiTypes['delete']['response'];

/** 지역 정렬 순서 변경 요청 */
export type RegionSortOrderRequest = RegionApiTypes['updateSortOrder']['request'];

/** 지역 정렬 순서 변경 응답 */
export type RegionSortOrderResponse = RegionApiTypes['updateSortOrder']['response'];
