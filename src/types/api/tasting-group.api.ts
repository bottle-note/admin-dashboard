/**
 * Tasting Tag Group API 타입 정의
 * 어드민 태그 그룹(맛 그룹) 관련 API 스펙
 * 계약: https://docs.bottle-note.com/#admin (tasting/groups, tasting/tags)
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const TastingGroupApi = {
  /** 태그 그룹 목록 조회 (태그 연결·계열 포함) */
  list: {
    endpoint: '/admin/api/v1/tasting/groups',
    method: 'GET',
  },
  /** 태그 그룹 상세 조회 */
  detail: {
    endpoint: '/admin/api/v1/tasting/groups/:code',
    method: 'GET',
  },
  /** 태그 그룹 생성 */
  create: {
    endpoint: '/admin/api/v1/tasting/groups',
    method: 'POST',
  },
  /** 태그 그룹 수정 (코드는 바꾸지 않는다) */
  update: {
    endpoint: '/admin/api/v1/tasting/groups/:code',
    method: 'PUT',
  },
  /** 태그 그룹 삭제 (태그가 연결돼 있으면 409) */
  delete: {
    endpoint: '/admin/api/v1/tasting/groups/:code',
    method: 'DELETE',
  },
  /** 태그 그룹에 태그 연결 (이미 있으면 역할만 변경) */
  addTags: {
    endpoint: '/admin/api/v1/tasting/groups/:code/tags',
    method: 'POST',
  },
  /** 태그 그룹 태그의 역할 변경 */
  changeTagRole: {
    endpoint: '/admin/api/v1/tasting/groups/:code/tags/:tagId',
    method: 'PUT',
  },
  /** 태그 그룹에서 태그 제거 */
  removeTag: {
    endpoint: '/admin/api/v1/tasting/groups/:code/tags/:tagId',
    method: 'DELETE',
  },
  /** 어느 그룹에도 속하지 않은 테이스팅 태그 조회 */
  ungroupedTags: {
    endpoint: '/admin/api/v1/tasting/tags/ungrouped',
    method: 'GET',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 태그 역할. CORE는 추천 점수에 1.0, PERIPHERAL은 0.4를 반영한다 */
export type TastingGroupRole = 'CORE' | 'PERIPHERAL';

/** enum 값을 화면 표기와 함께 내려주는 공용 항목 */
export interface CodeLabel {
  code: string;
  korName: string;
  engName: string;
  description: string;
}

/** 태그 그룹에 연결된 태그 한 건 */
export interface TastingGroupTag {
  tastingTagId: number;
  korName: string;
  role: CodeLabel & { code: TastingGroupRole };
  provider: CodeLabel;
  alcoholCount: number;
}

/** 태그 그룹 한 건. 목록과 상세가 같은 모양이다 */
export interface TastingGroupItem {
  id: number;
  code: string;
  name: string;
  family: string | null;
  description: string | null;
  displayOrder: number | null;
  tags: TastingGroupTag[];
}

/** 태그가 속한 그룹 하나 */
export interface TastingGroupRef {
  groupCode: string;
  groupName: string;
  role: CodeLabel & { code: TastingGroupRole };
}

/** 아이콘을 뺀 테이스팅 태그 사전 항목 (미소속 태그 조회 응답) */
export interface UngroupedTastingTag {
  id: number;
  korName: string;
  engName: string;
  parentId: number | null;
  alcoholCount: number;
  groups: TastingGroupRef[];
}

/** 생성·수정·삭제·연결 공통 결과 응답 */
export interface TastingGroupResultResponse {
  code: string;
  message: string;
  targetId: number;
  responseAt: string;
}

export interface TastingGroupApiTypes {
  list: {
    response: {
      groups: TastingGroupItem[];
      /** 그룹에 등장하는 계열의 distinct 목록 */
      families: string[];
    };
  };
  create: {
    request: {
      code: string;
      name: string;
      family?: string | null;
      description?: string | null;
      displayOrder?: number | null;
    };
  };
  update: {
    request: {
      name: string;
      family?: string | null;
      description?: string | null;
      displayOrder?: number | null;
    };
  };
  addTags: {
    request: {
      tastingTagIds: number[];
      role: TastingGroupRole;
    };
  };
  changeTagRole: {
    request: {
      role: TastingGroupRole;
    };
  };
  ungroupedTags: {
    params: {
      /** 한글 이름 부분 일치. 비우면 전체 */
      keyword?: string;
    };
  };
}

// ============================================
// 헬퍼 타입
// ============================================

export type TastingGroupListResponse = TastingGroupApiTypes['list']['response'];
export type TastingGroupCreateRequest = TastingGroupApiTypes['create']['request'];
export type TastingGroupUpdateRequest = TastingGroupApiTypes['update']['request'];
export type TastingGroupTagsRequest = TastingGroupApiTypes['addTags']['request'];
export type TastingGroupTagRoleRequest = TastingGroupApiTypes['changeTagRole']['request'];
export type UngroupedTastingTagParams = TastingGroupApiTypes['ungroupedTags']['params'];
