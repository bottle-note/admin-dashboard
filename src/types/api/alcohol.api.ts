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
  /** 술 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/alcohols/:alcoholId',
    method: 'GET',
  },
  /** 술 생성 */
  create: {
    endpoint: '/admin/api/v1/alcohols',
    method: 'POST',
  },
  /** 카테고리 레퍼런스 조회 */
  categoryReference: {
    endpoint: '/admin/api/v1/alcohols/categories/reference',
    method: 'GET',
  },
  /** 술 삭제 */
  delete: {
    endpoint: '/admin/api/v1/alcohols/:alcoholId',
    method: 'DELETE',
  },
  /** 술 수정 */
  update: {
    endpoint: '/admin/api/v1/alcohols/:alcoholId',
    method: 'PUT',
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

/** 술 타입 */
export type AlcoholType =
  | 'WHISKY'
  | 'RUM'
  | 'VODKA'
  | 'GIN'
  | 'TEQUILA'
  | 'BRANDY'
  | 'BEER'
  | 'WINE'
  | 'ETC';

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
  /** 술 상세 조회 */
  detail: {
    /** 응답 */
    response: {
      /** 술 ID */
      alcoholId: number;
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 이미지 URL */
      imageUrl: string | null;
      /** 술 타입 (WHISKY 등) */
      type: string;
      /** 카테고리 한글명 */
      korCategory: string;
      /** 카테고리 영문명 */
      engCategory: string;
      /** 카테고리 그룹 */
      categoryGroup: AlcoholCategory;
      /** 도수 */
      abv: string | null;
      /** 숙성년도 */
      age: string | null;
      /** 캐스크 타입 */
      cask: string | null;
      /** 용량 */
      volume: string | null;
      /** 설명 */
      description: string | null;
      /** 지역 ID */
      regionId: number | null;
      /** 지역 한글명 */
      korRegion: string | null;
      /** 지역 영문명 */
      engRegion: string | null;
      /** 증류소 ID */
      distilleryId: number | null;
      /** 증류소 한글명 */
      korDistillery: string | null;
      /** 증류소 영문명 */
      engDistillery: string | null;
      /** 테이스팅 태그 목록 */
      tastingTags: {
        /** 태그 ID */
        id: number;
        /** 태그 한글명 */
        korName: string;
        /** 태그 영문명 */
        engName: string;
      }[];
      /** 평균 평점 */
      avgRating: number;
      /** 평점 수 */
      totalRatingsCount: number;
      /** 리뷰 수 */
      reviewCount: number;
      /** 찜 수 */
      pickCount: number;
      /** 생성일시 */
      createdAt: string;
      /** 수정일시 */
      modifiedAt: string;
    };
  };
  /** 술 생성 */
  create: {
    /** 요청 데이터 */
    request: {
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 도수 (예: "40%") */
      abv: string;
      /** 술 타입 */
      type: AlcoholType;
      /** 카테고리 한글명 */
      korCategory: string;
      /** 카테고리 영문명 */
      engCategory: string;
      /** 카테고리 그룹 */
      categoryGroup: AlcoholCategory;
      /** 지역 ID */
      regionId: number;
      /** 증류소 ID */
      distilleryId: number;
      /** 숙성년도 */
      age: string;
      /** 캐스크 타입 */
      cask: string;
      /** 이미지 URL */
      imageUrl: string;
      /** 설명 */
      description: string;
      /** 용량 (예: "700ml") */
      volume: string;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 생성된 술 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 술 삭제 */
  delete: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 삭제된 술 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 술 수정 */
  update: {
    /** 요청 데이터 */
    request: {
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 도수 (예: "40%") */
      abv: string;
      /** 술 타입 */
      type: AlcoholType;
      /** 카테고리 한글명 */
      korCategory: string;
      /** 카테고리 영문명 */
      engCategory: string;
      /** 카테고리 그룹 */
      categoryGroup: AlcoholCategory;
      /** 지역 ID */
      regionId: number;
      /** 증류소 ID */
      distilleryId: number;
      /** 숙성년도 */
      age: string;
      /** 캐스크 타입 */
      cask: string;
      /** 이미지 URL */
      imageUrl: string;
      /** 설명 */
      description: string;
      /** 용량 (예: "700ml") */
      volume: string;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 수정된 술 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
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

/** 술 상세 정보 */
export type AlcoholDetail = AlcoholApiTypes['detail']['response'];

/** 술에 연결된 테이스팅 태그 */
export type AlcoholTastingTag = AlcoholApiTypes['detail']['response']['tastingTags'][number];

/** 술 생성 요청 데이터 */
export type AlcoholCreateRequest = AlcoholApiTypes['create']['request'];

/** 술 생성 응답 데이터 */
export type AlcoholCreateResponse = AlcoholApiTypes['create']['response'];

/** 술 삭제 응답 데이터 */
export type AlcoholDeleteResponse = AlcoholApiTypes['delete']['response'];

/** 술 수정 요청 데이터 */
export type AlcoholUpdateRequest = AlcoholApiTypes['update']['request'];

/** 술 수정 응답 데이터 */
export type AlcoholUpdateResponse = AlcoholApiTypes['update']['response'];

// ============================================
// 카테고리 레퍼런스 타입
// ============================================

/** 카테고리 레퍼런스 아이템 */
export interface CategoryReference {
  /** 한글 카테고리 */
  korCategory: string;
  /** 영문 카테고리 */
  engCategory: string;
  /** 카테고리 그룹 */
  categoryGroup: AlcoholCategory;
}
