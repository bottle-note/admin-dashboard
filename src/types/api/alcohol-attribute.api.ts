/**
 * Alcohol Attribute API 타입 정의
 * 어드민 위스키 속성(키워드·가격·대중성 점수 등) 관련 API 스펙
 * 계약: https://docs.bottle-note.com/#admin (alcohols/attributes)
 */

import type { ApiMeta } from './common';
import type { CodeLabel } from './tasting-group.api';

// ============================================
// API 엔드포인트 정의
// ============================================

export const AlcoholAttributeApi = {
  /** 선택한 위스키의 속성 행 조회 (alcoholIds 쉼표 구분) */
  list: {
    endpoint: '/admin/api/v1/alcohols/attributes',
    method: 'GET',
  },
  /** 여러 위스키에 같은 속성 추가 (같은 항목·값이 있는 위스키는 건너뜀) */
  create: {
    endpoint: '/admin/api/v1/alcohols/attributes',
    method: 'POST',
  },
  /** 속성 한 건 수정 (항목 key는 바꾸지 않는다) */
  update: {
    endpoint: '/admin/api/v1/alcohols/attributes/:id',
    method: 'PUT',
  },
  /** 속성 한 건 삭제 */
  delete: {
    endpoint: '/admin/api/v1/alcohols/attributes/:id',
    method: 'DELETE',
  },
  /** 속성 여러 건 삭제 (지운 행을 반환) */
  batchDelete: {
    endpoint: '/admin/api/v1/alcohols/attributes/batch/delete',
    method: 'POST',
  },
  /** 속성이 붙은 위스키 목록 (페이지, 각 줄에 속성 행 포함) */
  attributedAlcohols: {
    endpoint: '/admin/api/v1/alcohols/attributes/alcohols',
    method: 'GET',
  },
  /** 선택한 위스키의 속성 묶음 요약 */
  summary: {
    endpoint: '/admin/api/v1/alcohols/attributes/summary',
    method: 'GET',
  },
  /** 키워드 분류 값과 사용 위스키 수 (전체 기준) */
  keywords: {
    endpoint: '/admin/api/v1/alcohols/attributes/keywords',
    method: 'GET',
  },
  /** 항목별 집계 (전체 기준) */
  keys: {
    endpoint: '/admin/api/v1/alcohols/attributes/keys',
    method: 'GET',
  },
  /** 분류·값 형식·값 제공자 라벨 */
  enums: {
    endpoint: '/admin/api/v1/alcohols/attributes/enums',
    method: 'GET',
  },
} as const;

// ============================================
// 공통 타입
// ============================================

/** 속성 분류 */
export type AlcoholAttributeType =
  | 'KEYWORD'
  | 'POPULARITY'
  | 'PRICE'
  | 'FLAG'
  | 'IDENTITY'
  | 'NOTE';

/** 값 형식. 값은 문자열로 주고받고 형식으로 검증한다 */
export type AlcoholAttributeDatatype = 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN';

/** 행을 만들거나 고친 주체 */
export interface AlcoholAttributePrincipal {
  id: number | null;
  type: 'USER' | 'ADMIN' | 'AGENT' | 'SYSTEM' | 'ANONYMOUS';
  email: string | null;
}

/** 속성 행 한 건 */
export interface AlcoholAttributeRow {
  id: number;
  alcoholId: number;
  key: string;
  type: AlcoholAttributeType;
  datatype: AlcoholAttributeDatatype;
  value: string;
  description: string | null;
  /** 값의 기준 시점 (가격·점수처럼 시점이 있는 값만) */
  basedAt: string | null;
  createAt: string | null;
  lastModifyAt: string | null;
  createPrincipal: AlcoholAttributePrincipal | null;
  lastModifyPrincipal: AlcoholAttributePrincipal | null;
}

/**
 * 속성 묶음 요약 한 건
 * 숫자 형식은 항목(key)별, 그 외는 항목·값별로 묶인다.
 */
export interface AlcoholAttributeSummaryItem {
  key: string;
  /** 숫자 묶음은 null */
  value: string | null;
  type: AlcoholAttributeType;
  datatype: AlcoholAttributeDatatype;
  /** 묶음에 값이 있는 위스키 */
  alcoholIds: number[];
  /** 묶음에 속한 속성 행 */
  attributeIds: number[];
  registeredCount: number;
  selectedCount: number;
  min: number | null;
  max: number | null;
  allSameValue: boolean;
}

/** 항목별 집계 */
export interface AlcoholAttributeKeyStat {
  key: string;
  type: AlcoholAttributeType;
  datatype: AlcoholAttributeDatatype;
  count: number;
  alcoholCount: number;
}

/** 키워드 값별 사용 위스키 수 */
export interface AlcoholAttributeKeywordCount {
  value: string;
  alcoholCount: number;
}

/** 화면 라벨 */
export interface AlcoholAttributeEnums {
  types: Array<CodeLabel & { code: AlcoholAttributeType }>;
  datatypes: Array<CodeLabel & { code: AlcoholAttributeDatatype }>;
  providers: CodeLabel[];
}

/** 속성이 붙은 위스키 한 줄 */
export interface AttributedAlcoholItem {
  alcoholId: number;
  korName: string;
  engName: string;
  korCategory: string | null;
  imageUrl: string | null;
  attributes: AlcoholAttributeRow[];
}

// ============================================
// 요청·응답 타입
// ============================================

/** 속성이 붙은 위스키 목록 조건. 비우면 무시한다 */
export interface AttributedAlcoholSearchParams {
  /** 위스키 이름 (한글/영문) */
  keyword?: string;
  type?: AlcoholAttributeType;
  key?: string;
  /** 정확히 일치 */
  value?: string;
  /** 이 항목이 없는 위스키만 */
  missingKey?: string;
  /** 0부터 */
  page?: number;
  /** 기본 20, 최대 100 */
  size?: number;
}

export type AttributedAlcoholPageMeta = ApiMeta & {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export interface AttributedAlcoholListResponse {
  items: AttributedAlcoholItem[];
  meta: AttributedAlcoholPageMeta;
}

export interface AlcoholAttributeListParams {
  alcoholIds: number[];
}

export interface AlcoholAttributeCreateRequest {
  alcoholIds: number[];
  key: string;
  type: AlcoholAttributeType;
  datatype: AlcoholAttributeDatatype;
  value: string;
  description?: string | null;
  basedAt?: string | null;
}

export interface AlcoholAttributeCreateResponse {
  added: number;
  skipped: number;
  createdIds: number[];
}

export interface AlcoholAttributeUpdateRequest {
  type: AlcoholAttributeType;
  datatype: AlcoholAttributeDatatype;
  value: string;
  description?: string | null;
  basedAt?: string | null;
}

export interface AlcoholAttributeBatchDeleteRequest {
  ids: number[];
}

/** 수정·삭제 결과 */
export interface AlcoholAttributeResultResponse {
  code: string;
  message: string;
  targetId: number | null;
  responseAt: string;
}
