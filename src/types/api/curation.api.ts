/**
 * Curation API 타입 정의
 * 어드민 큐레이션 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const CurationApi = {
  /** 큐레이션 목록 조회 */
  search: {
    endpoint: '/admin/api/v1/curations',
    method: 'GET',
  },
  /** 큐레이션 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/curations/:curationId',
    method: 'GET',
  },
  /** 큐레이션 생성 */
  create: {
    endpoint: '/admin/api/v1/curations',
    method: 'POST',
  },
  /** 큐레이션 수정 */
  update: {
    endpoint: '/admin/api/v1/curations/:curationId',
    method: 'PUT',
  },
  /** 큐레이션 삭제 */
  delete: {
    endpoint: '/admin/api/v1/curations/:curationId',
    method: 'DELETE',
  },
  /** 큐레이션 활성화 상태 토글 */
  toggleStatus: {
    endpoint: '/admin/api/v1/curations/:curationId/status',
    method: 'PATCH',
  },
  /** 큐레이션 노출 순서 변경 */
  updateDisplayOrder: {
    endpoint: '/admin/api/v1/curations/:curationId/display-order',
    method: 'PATCH',
  },
  /** 큐레이션 위스키 추가 */
  addAlcohols: {
    endpoint: '/admin/api/v1/curations/:curationId/alcohols',
    method: 'POST',
  },
  /** 큐레이션 위스키 제거 */
  removeAlcohol: {
    endpoint: '/admin/api/v1/curations/:curationId/alcohols/:alcoholId',
    method: 'DELETE',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/**
 * 큐레이션에 포함된 위스키 정보
 */
export interface CurationAlcoholItem {
  /** 위스키 ID */
  alcoholId: number;
  /** 한글명 */
  korName: string;
  /** 영문명 */
  engName: string;
  /** 위스키 이미지 URL (nullable) */
  imageUrl: string | null;
}

// ============================================
// API 타입 정의
// ============================================

export interface CurationApiTypes {
  /** 큐레이션 목록 조회 */
  search: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 (큐레이션명 검색) */
      keyword?: string;
      /** 활성화 상태 필터 */
      isActive?: boolean;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 큐레이션 ID */
      id: number;
      /** 큐레이션명 */
      name: string;
      /** 설명 (nullable) */
      description: string | null;
      /** 커버 이미지 URL (nullable) */
      coverImageUrl: string | null;
      /** 노출 순서 */
      displayOrder: number;
      /** 포함된 위스키 수 */
      alcoholCount: number;
      /** 활성화 상태 */
      isActive: boolean;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      updatedAt: string;
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
  /** 큐레이션 상세 조회 */
  detail: {
    /** 응답 (API 원본) */
    response: {
      /** 큐레이션 ID */
      id: number;
      /** 큐레이션명 */
      name: string;
      /** 설명 (nullable) */
      description: string | null;
      /** 커버 이미지 URL (nullable) */
      coverImageUrl: string | null;
      /** 노출 순서 */
      displayOrder: number;
      /** 활성화 상태 */
      isActive: boolean;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      modifiedAt: string;
      /** 포함된 위스키 ID 목록 */
      alcoholIds: number[];
    };
  };
  /** 큐레이션 생성 */
  create: {
    /** 요청 데이터 */
    request: {
      /** 큐레이션명 */
      name: string;
      /** 설명 (선택) */
      description?: string;
      /** 커버 이미지 URL (선택) */
      coverImageUrl?: string;
      /** 노출 순서 (선택) */
      displayOrder?: number;
      /** 포함할 위스키 ID 목록 (선택) */
      alcoholIds?: number[];
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 생성된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 수정 */
  update: {
    /** 요청 데이터 */
    request: {
      /** 큐레이션명 */
      name: string;
      /** 설명 (선택) */
      description?: string;
      /** 커버 이미지 URL (선택) */
      coverImageUrl?: string;
      /** 노출 순서 (선택) */
      displayOrder?: number;
      /** 포함할 위스키 ID 목록 (선택) */
      alcoholIds?: number[];
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 삭제 */
  delete: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 삭제된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 활성화 상태 토글 */
  toggleStatus: {
    /** 요청 데이터 */
    request: {
      /** 활성화 상태 */
      isActive: boolean;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 노출 순서 변경 */
  updateDisplayOrder: {
    /** 요청 데이터 */
    request: {
      /** 노출 순서 */
      displayOrder: number;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 위스키 추가 */
  addAlcohols: {
    /** 요청 데이터 */
    request: {
      /** 추가할 위스키 ID 목록 */
      alcoholIds: number[];
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 큐레이션 위스키 제거 */
  removeAlcohol: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 큐레이션 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 큐레이션 목록 조회 파라미터 */
export type CurationSearchParams = CurationApiTypes['search']['params'];

/** 큐레이션 목록 아이템 */
export type CurationListItem = CurationApiTypes['search']['response'];

/** 큐레이션 목록 페이지네이션 메타 */
export type CurationPageMeta = CurationApiTypes['search']['meta'];

/** 큐레이션 상세 정보 (API 응답) */
export type CurationDetailResponse = CurationApiTypes['detail']['response'];

/**
 * 큐레이션 상세 정보 (UI용 확장 타입)
 * API 응답을 UI에서 사용하기 편한 형태로 변환한 타입
 */
export interface CurationDetail {
  /** 큐레이션 ID */
  id: number;
  /** 큐레이션명 */
  name: string;
  /** 설명 (nullable) */
  description: string | null;
  /** 커버 이미지 URL (nullable) */
  coverImageUrl: string | null;
  /** 노출 순서 */
  displayOrder: number;
  /** 활성화 상태 */
  isActive: boolean;
  /** 생성일시 */
  createdAt: string;
  /** 수정일시 */
  updatedAt: string;
  /** 포함된 위스키 수 */
  alcoholCount: number;
  /** 큐레이션에 포함된 위스키 목록 */
  alcohols: CurationAlcoholItem[];
}

/** 큐레이션 생성 요청 데이터 */
export type CurationCreateRequest = CurationApiTypes['create']['request'];

/** 큐레이션 생성 응답 데이터 */
export type CurationCreateResponse = CurationApiTypes['create']['response'];

/** 큐레이션 수정 요청 데이터 */
export type CurationUpdateRequest = CurationApiTypes['update']['request'];

/** 큐레이션 수정 응답 데이터 */
export type CurationUpdateResponse = CurationApiTypes['update']['response'];

/** 큐레이션 삭제 응답 데이터 */
export type CurationDeleteResponse = CurationApiTypes['delete']['response'];

/** 큐레이션 활성화 상태 토글 요청 데이터 */
export type CurationToggleStatusRequest = CurationApiTypes['toggleStatus']['request'];

/** 큐레이션 활성화 상태 토글 응답 데이터 */
export type CurationToggleStatusResponse = CurationApiTypes['toggleStatus']['response'];

/** 큐레이션 노출 순서 변경 요청 데이터 */
export type CurationUpdateDisplayOrderRequest = CurationApiTypes['updateDisplayOrder']['request'];

/** 큐레이션 노출 순서 변경 응답 데이터 */
export type CurationUpdateDisplayOrderResponse = CurationApiTypes['updateDisplayOrder']['response'];

/** 큐레이션 위스키 추가 요청 데이터 */
export type CurationAddAlcoholsRequest = CurationApiTypes['addAlcohols']['request'];

/** 큐레이션 위스키 추가 응답 데이터 */
export type CurationAddAlcoholsResponse = CurationApiTypes['addAlcohols']['response'];

/** 큐레이션 위스키 제거 응답 데이터 */
export type CurationRemoveAlcoholResponse = CurationApiTypes['removeAlcohol']['response'];
