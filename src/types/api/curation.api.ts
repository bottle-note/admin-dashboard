/**
 * Spec 기반 큐레이션 v2 API 타입 정의
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const CurationV2Api = {
  /** 큐레이션 스펙 목록 조회 */
  listSpecs: {
    endpoint: '/admin/api/v2/curation-specs',
    method: 'GET',
  },
  /** 큐레이션 스펙 상세 조회 */
  specDetail: {
    endpoint: '/admin/api/v2/curation-specs/:specId',
    method: 'GET',
  },
  /** Spec 기반 큐레이션 목록 조회 */
  list: {
    endpoint: '/admin/api/v2/curations',
    method: 'GET',
  },
  /** Spec 기반 큐레이션 상세 조회 */
  detail: {
    endpoint: '/admin/api/v2/curations/:curationId',
    method: 'GET',
  },
  /** Spec 기반 큐레이션 생성 */
  create: {
    endpoint: '/admin/api/v2/curations',
    method: 'POST',
  },
  /** Spec 기반 큐레이션 수정 */
  update: {
    endpoint: '/admin/api/v2/curations/:curationId',
    method: 'PUT',
  },
} as const;

// ============================================
// JSON Schema / OpenAPI Schema subset
// ============================================

export type JsonSchemaPrimitiveType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export type JsonSchemaEnumValue = string | number | boolean | null;

export interface JsonSchemaNode {
  type?: JsonSchemaPrimitiveType | JsonSchemaPrimitiveType[];
  title?: string;
  description?: string;
  format?: string;
  nullable?: boolean;
  example?: unknown;
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  required?: string[];
  enum?: JsonSchemaEnumValue[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  [key: `x-${string}`]: unknown;
}

export type JsonSchemaObject = JsonSchemaNode;

// ============================================
// 공통 타입
// ============================================

export const CurationSpecCode = {
  WHISKY_TASTING_EVENT: 'WHISKY_TASTING_EVENT',
  RECOMMENDED_WHISKY: 'RECOMMENDED_WHISKY',
  WHISKY_PAIRING: 'WHISKY_PAIRING',
} as const;

export type KnownCurationV2SpecCode = (typeof CurationSpecCode)[keyof typeof CurationSpecCode];

export type CurationV2SpecCode = KnownCurationV2SpecCode | (string & {});

export type CurationV2PayloadItem = Record<string, unknown>;

export type CurationV2Payload = CurationV2PayloadItem | CurationV2PayloadItem[];

export interface CurationV2Spec {
  id: number;
  code: CurationV2SpecCode;
  name: string;
  description: string | null;
  hydratorKey: string | null;
  version: number;
  isActive: boolean;
  requestSpec: JsonSchemaObject;
  responseSpec: JsonSchemaObject;
}

export interface CurationV2SpecListItem {
  id: number;
  code: CurationV2SpecCode;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
}

export interface CurationV2PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CurationV2MutationResponse {
  code: string;
  message: string;
  targetId: number;
  responseAt: string;
}

// ============================================
// API 타입 정의
// ============================================

export interface CurationV2ApiTypes {
  /** 큐레이션 스펙 목록 조회 */
  listSpecs: {
    response: CurationV2SpecListItem;
  };
  /** 큐레이션 스펙 상세 조회 */
  specDetail: {
    response: CurationV2Spec;
  };
  /** Spec 기반 큐레이션 목록 조회 */
  list: {
    params: {
      /** 검색어 */
      keyword?: string;
      /** 활성화 상태 */
      isActive?: boolean;
      /** 페이지 번호 (0-based) */
      page?: number;
      /** 페이지 크기 */
      size?: number;
    };
    response: {
      id: number;
      specId: number;
      specCode: CurationV2SpecCode;
      name: string;
      displayOrder: number;
      isActive: boolean;
      createdAt: string;
    };
    meta: CurationV2PageMeta;
  };
  /** Spec 기반 큐레이션 상세 조회 */
  detail: {
    response: {
      id: number;
      name: string;
      description: string | null;
      coverImageUrl: string | null;
      imageUrls: string[];
      exposureStartDate: string | null;
      exposureEndDate: string | null;
      displayOrder: number;
      isActive: boolean;
      createdAt: string;
      modifiedAt: string;
      spec: CurationV2Spec;
      payload: CurationV2Payload;
    };
  };
  /** Spec 기반 큐레이션 생성 */
  create: {
    request: {
      specId: number;
      name: string;
      description: string | null;
      imageUrls: string[];
      exposureStartDate: string | null;
      exposureEndDate: string | null;
      displayOrder: number;
      isActive: boolean;
      payload: CurationV2Payload;
    };
    response: CurationV2MutationResponse;
  };
  /** Spec 기반 큐레이션 수정 */
  update: {
    request: CurationV2ApiTypes['create']['request'];
    response: CurationV2MutationResponse;
  };
}

// ============================================
// 헬퍼 타입
// ============================================

export type CurationV2SearchParams = CurationV2ApiTypes['list']['params'];

export type CurationV2ListItem = CurationV2ApiTypes['list']['response'];

export type CurationV2Detail = CurationV2ApiTypes['detail']['response'];

export type CurationV2CreateRequest = CurationV2ApiTypes['create']['request'];

export type CurationV2CreateResponse = CurationV2ApiTypes['create']['response'];

export type CurationV2UpdateRequest = CurationV2ApiTypes['update']['request'];

export type CurationV2UpdateResponse = CurationV2ApiTypes['update']['response'];
