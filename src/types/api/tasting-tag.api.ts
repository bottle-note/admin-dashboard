/**
 * Tasting Tag API 타입 정의
 * 어드민 테이스팅 태그 관련 API 스펙
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const TastingTagApi = {
  /** 테이스팅 태그 목록 조회 */
  list: {
    endpoint: '/admin/api/v1/tasting-tags',
    method: 'GET',
  },
  /** 테이스팅 태그 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/tasting-tags/:id',
    method: 'GET',
  },
  /** 테이스팅 태그 생성 */
  create: {
    endpoint: '/admin/api/v1/tasting-tags',
    method: 'POST',
  },
  /** 테이스팅 태그 수정 */
  update: {
    endpoint: '/admin/api/v1/tasting-tags/:id',
    method: 'PUT',
  },
  /** 테이스팅 태그 삭제 */
  delete: {
    endpoint: '/admin/api/v1/tasting-tags/:id',
    method: 'DELETE',
  },
  /** 테이스팅 태그와 위스키 연결 */
  connectAlcohols: {
    endpoint: '/admin/api/v1/tasting-tags/:id/alcohols',
    method: 'POST',
  },
  /** 테이스팅 태그와 위스키 연결 해제 */
  disconnectAlcohols: {
    endpoint: '/admin/api/v1/tasting-tags/:id/alcohols',
    method: 'DELETE',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 정렬 방향 */
export type TastingTagSortOrder = 'ASC' | 'DESC';

// ============================================
// API 타입 정의
// ============================================

/**
 * 테이스팅 태그 트리 노드
 * @param id - 태그 ID
 * @param korName - 한글 이름
 * @param engName - 영문 이름
 * @param icon - 아이콘
 * @param description - 설명
 * @param parent - 부모 태그
 * @param children - 자식 태그 목록
 */
export interface TastingTagTreeNode {
  id: number;
  korName: string;
  engName: string;
  icon: string | null;
  description: string | null;
  parent: TastingTagTreeNode | null;
  children: TastingTagTreeNode[];
}

/**
 * 테이스팅 태그 연관 위스키
 * @param alcoholId - 위스키 ID
 * @param korName - 한글 이름
 * @param engName - 영문 이름
 * @param korCategoryName - 한글 카테고리
 * @param engCategoryName - 영문 카테고리
 * @param imageUrl - 이미지 URL
 * @param createdAt - 생성일시
 * @param modifiedAt - 수정일시
 */
export interface TastingTagAlcohol {
  alcoholId: number;
  korName: string;
  engName: string;
  korCategoryName: string;
  engCategoryName: string;
  imageUrl: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface TastingTagApiTypes {
  /** 테이스팅 태그 목록 조회 */
  list: {
    /** 요청 파라미터 */
    params: {
      /** 검색어 (한글/영문 이름 검색) */
      keyword?: string;
      /** 페이지 번호 (기본값: 0) */
      page?: number;
      /** 페이지 크기 (기본값: 20) */
      size?: number;
      /** 정렬 방향 (기본값: ASC) */
      sortOrder?: TastingTagSortOrder;
    };
    /** 응답 아이템 */
    response: {
      /** 태그 ID */
      id: number;
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 아이콘 */
      icon: string | null;
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
  /** 테이스팅 태그 상세 조회 */
  detail: {
    /** 응답 */
    response: {
      tag: {
        id: number;
        korName: string;
        engName: string;
        icon: string | null;
        description: string | null;
        parent: TastingTagTreeNode | null;
        children: TastingTagTreeNode[];
      };
      alcohols: TastingTagAlcohol[];
    };
  };
  /** 테이스팅 태그 생성/수정 요청 */
  form: {
    /** 요청 데이터 */
    request: {
      /** 한글 이름 */
      korName: string;
      /** 영문 이름 */
      engName: string;
      /** 아이콘 */
      icon?: string | null;
      /** 태그 설명 */
      description?: string | null;
    };
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 생성/수정된 태그 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 테이스팅 태그 삭제 */
  delete: {
    /** 응답 데이터 */
    response: {
      /** 결과 코드 */
      code: string;
      /** 결과 메시지 */
      message: string;
      /** 삭제된 태그 ID */
      targetId: number;
      /** 응답 시간 */
      responseAt: string;
    };
  };
  /** 위스키 연결/해제 요청 */
  alcoholConnection: {
    request: {
      alcoholIds: number[];
    };
    response: {
      code: string;
      message: string;
      targetId: number;
      responseAt: string;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

/** 테이스팅 태그 목록 조회 파라미터 */
export type TastingTagSearchParams = TastingTagApiTypes['list']['params'];

/** 테이스팅 태그 목록 아이템 */
export type TastingTagListItem = TastingTagApiTypes['list']['response'];

/** 테이스팅 태그 목록 페이지네이션 메타 */
export type TastingTagPageMeta = TastingTagApiTypes['list']['meta'];

/** 테이스팅 태그 상세 */
export type TastingTagDetail = TastingTagApiTypes['detail']['response'];

/** 테이스팅 태그 폼 데이터 (생성/수정) */
export type TastingTagFormData = TastingTagApiTypes['form']['request'];

/** 테이스팅 태그 생성/수정 응답 */
export type TastingTagFormResponse = TastingTagApiTypes['form']['response'];

/** 테이스팅 태그 삭제 응답 */
export type TastingTagDeleteResponse = TastingTagApiTypes['delete']['response'];

/** 위스키 연결/해제 요청 */
export type TastingTagAlcoholConnectionRequest = TastingTagApiTypes['alcoholConnection']['request'];

/** 위스키 연결/해제 응답 */
export type TastingTagAlcoholConnectionResponse = TastingTagApiTypes['alcoholConnection']['response'];
