/**
 * Banner API 타입 정의
 * 어드민 배너 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const BannerApi = {
  /** 배너 목록 조회 */
  search: {
    endpoint: '/admin/api/v1/banners',
    method: 'GET',
  },
  /** 배너 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/banners/:bannerId',
    method: 'GET',
  },
  /** 배너 생성 */
  create: {
    endpoint: '/admin/api/v1/banners',
    method: 'POST',
  },
  /** 배너 수정 */
  update: {
    endpoint: '/admin/api/v1/banners/:bannerId',
    method: 'PUT',
  },
  /** 배너 삭제 */
  delete: {
    endpoint: '/admin/api/v1/banners/:bannerId',
    method: 'DELETE',
  },
  /** 배너 상태 변경 */
  updateStatus: {
    endpoint: '/admin/api/v1/banners/:bannerId/status',
    method: 'PATCH',
  },
  /** 배너 정렬순서 변경 */
  updateSortOrder: {
    endpoint: '/admin/api/v1/banners/:bannerId/sort-order',
    method: 'PATCH',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/**
 * 배너 유형
 * @description 배너의 목적에 따른 유형 구분
 */
export type BannerType = 'SURVEY' | 'CURATION' | 'AD' | 'PARTNERSHIP' | 'ETC';

/**
 * 텍스트 위치
 * @description 배너 내 텍스트가 표시될 위치
 */
export type TextPosition = 'LT' | 'LB' | 'RT' | 'RB' | 'CENTER';

/** 배너 타입 레이블 매핑 */
export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  SURVEY: '설문조사',
  CURATION: '큐레이션',
  AD: '광고',
  PARTNERSHIP: '제휴',
  ETC: '기타',
};

/** 텍스트 위치 레이블 매핑 */
export const TEXT_POSITION_LABELS: Record<TextPosition, string> = {
  LT: '좌측 상단',
  LB: '좌측 하단',
  RT: '우측 상단',
  RB: '우측 하단',
  CENTER: '중앙',
};

// ============================================
// API 타입 정의
// ============================================

export interface BannerApiTypes {
  /** 배너 목록 조회 */
  search: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 (배너명 검색) */
      keyword?: string;
      /** 배너 타입 필터 */
      bannerType?: BannerType;
      /** 활성화 상태 필터 */
      isActive?: boolean;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
    };
    /** 응답 아이템 */
    response: {
      /** 배너 ID */
      id: number;
      /** 배너명 */
      name: string;
      /** 배너 유형 */
      bannerType: BannerType;
      /** 이미지 URL */
      imageUrl: string;
      /** 정렬 순서 */
      sortOrder: number;
      /** 노출 시작일시 (nullable = 상시노출) */
      startDate: string | null;
      /** 노출 종료일시 (nullable = 상시노출) */
      endDate: string | null;
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
  /** 배너 상세 조회 */
  detail: {
    /** 응답 */
    response: {
      /** 배너 ID */
      id: number;
      /** 배너명 */
      name: string;
      /** 배너명 텍스트 색상 (HEX) */
      nameFontColor: string;
      /** 배너 설명 파트 A */
      descriptionA: string;
      /** 배너 설명 파트 B */
      descriptionB: string;
      /** 배너 설명 텍스트 색상 (HEX) */
      descriptionFontColor: string;
      /** 배너 이미지 URL */
      imageUrl: string;
      /** 텍스트 위치 */
      textPosition: TextPosition;
      /** 클릭 시 이동할 URL */
      targetUrl: string;
      /** 외부 URL 여부 */
      isExternalUrl: boolean;
      /** 배너 유형 */
      bannerType: BannerType;
      /** 정렬 순서 */
      sortOrder: number;
      /** 노출 시작일시 (nullable = 상시노출) */
      startDate: string | null;
      /** 노출 종료일시 (nullable = 상시노출) */
      endDate: string | null;
      /** 활성화 상태 */
      isActive: boolean;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      updatedAt: string;
    };
  };
  /** 배너 생성 */
  create: {
    /** 요청 데이터 */
    request: {
      /** 배너명 */
      name: string;
      /** 배너명 텍스트 색상 (HEX) */
      nameFontColor: string;
      /** 배너 설명 파트 A */
      descriptionA: string;
      /** 배너 설명 파트 B */
      descriptionB: string;
      /** 배너 설명 텍스트 색상 (HEX) */
      descriptionFontColor: string;
      /** 배너 이미지 URL */
      imageUrl: string;
      /** 텍스트 위치 */
      textPosition: TextPosition;
      /** 클릭 시 이동할 URL */
      targetUrl: string;
      /** 외부 URL 여부 */
      isExternalUrl: boolean;
      /** 배너 유형 */
      bannerType: BannerType;
      /** 정렬 순서 (optional, 기본값 0) */
      sortOrder?: number;
      /** 노출 시작일시 */
      startDate: string | null;
      /** 노출 종료일시 */
      endDate: string | null;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 생성된 배너 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 배너 수정 */
  update: {
    /** 요청 데이터 */
    request: {
      /** 배너명 */
      name: string;
      /** 배너명 텍스트 색상 (HEX) */
      nameFontColor: string;
      /** 배너 설명 파트 A */
      descriptionA: string;
      /** 배너 설명 파트 B */
      descriptionB: string;
      /** 배너 설명 텍스트 색상 (HEX) */
      descriptionFontColor: string;
      /** 배너 이미지 URL */
      imageUrl: string;
      /** 텍스트 위치 */
      textPosition: TextPosition;
      /** 클릭 시 이동할 URL */
      targetUrl: string;
      /** 외부 URL 여부 */
      isExternalUrl: boolean;
      /** 배너 유형 */
      bannerType: BannerType;
      /** 정렬 순서 */
      sortOrder: number;
      /** 노출 시작일시 (nullable = 상시노출) */
      startDate: string | null;
      /** 노출 종료일시 (nullable = 상시노출) */
      endDate: string | null;
      /** 활성화 상태 */
      isActive: boolean;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 배너 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 배너 삭제 */
  delete: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 삭제된 배너 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 배너 상태 변경 */
  updateStatus: {
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
      /** 배너 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 배너 정렬순서 변경 */
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
      /** 배너 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 배너 목록 조회 파라미터 */
export type BannerSearchParams = BannerApiTypes['search']['params'];

/** 배너 목록 아이템 */
export type BannerListItem = BannerApiTypes['search']['response'];

/** 배너 목록 페이지네이션 메타 */
export type BannerPageMeta = BannerApiTypes['search']['meta'];

/** 배너 상세 정보 */
export type BannerDetail = BannerApiTypes['detail']['response'];

/** 배너 생성 요청 데이터 */
export type BannerCreateRequest = BannerApiTypes['create']['request'];

/** 배너 생성 응답 데이터 */
export type BannerCreateResponse = BannerApiTypes['create']['response'];

/** 배너 수정 요청 데이터 */
export type BannerUpdateRequest = BannerApiTypes['update']['request'];

/** 배너 수정 응답 데이터 */
export type BannerUpdateResponse = BannerApiTypes['update']['response'];

/** 배너 삭제 응답 데이터 */
export type BannerDeleteResponse = BannerApiTypes['delete']['response'];

/** 배너 상태 변경 요청 데이터 */
export type BannerUpdateStatusRequest = BannerApiTypes['updateStatus']['request'];

/** 배너 상태 변경 응답 데이터 */
export type BannerUpdateStatusResponse = BannerApiTypes['updateStatus']['response'];

/** 배너 정렬순서 변경 요청 데이터 */
export type BannerUpdateSortOrderRequest = BannerApiTypes['updateSortOrder']['request'];

/** 배너 정렬순서 변경 응답 데이터 */
export type BannerUpdateSortOrderResponse = BannerApiTypes['updateSortOrder']['response'];
