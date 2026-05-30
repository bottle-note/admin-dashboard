/**
 * Spec 기반 큐레이션 v2 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import {
  CurationV2Api,
  type CurationV2CreateRequest,
  type CurationV2CreateResponse,
  type CurationV2Detail,
  type CurationV2ListItem,
  type CurationV2PageMeta,
  type CurationV2SearchParams,
  type CurationV2Spec,
  type CurationV2SpecCode,
  type CurationV2UpdateRequest,
  type CurationV2UpdateResponse,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const curationV2Keys = {
  all: ['curation-v2'] as const,
  specs: () => [...curationV2Keys.all, 'specs'] as const,
  spec: (specId: number) => [...curationV2Keys.specs(), specId] as const,
  specByCode: (specCode: CurationV2SpecCode) =>
    [...curationV2Keys.specs(), 'code', specCode] as const,
  lists: () => [...curationV2Keys.all, 'list'] as const,
  list: (params?: CurationV2SearchParams) =>
    params ? ([...curationV2Keys.lists(), params] as const) : curationV2Keys.lists(),
  details: () => [...curationV2Keys.all, 'detail'] as const,
  detail: (curationId: number) => [...curationV2Keys.details(), curationId] as const,
};

// ============================================
// 응답 타입
// ============================================

export interface CurationV2ListResponse {
  items: CurationV2ListItem[];
  meta: CurationV2PageMeta;
}

// ============================================
// Spec resolver
// ============================================

export function resolveCurationV2SpecByCode(
  specs: CurationV2Spec[],
  specCode: CurationV2SpecCode
): CurationV2Spec | null {
  return specs.find((spec) => spec.code === specCode) ?? null;
}

// ============================================
// Service
// ============================================

export const curationV2Service = {
  /**
   * 큐레이션 스펙 목록 조회
   */
  listSpecs: async (): Promise<CurationV2Spec[]> => {
    return apiClient.get<CurationV2Spec[]>(CurationV2Api.listSpecs.endpoint);
  },

  /**
   * 큐레이션 스펙 상세 조회
   */
  getSpec: async (specId: number): Promise<CurationV2Spec> => {
    const endpoint = CurationV2Api.specDetail.endpoint.replace(':specId', String(specId));
    return apiClient.get<CurationV2Spec>(endpoint);
  },

  /**
   * Spec 기반 큐레이션 목록 조회
   */
  list: async (params?: CurationV2SearchParams): Promise<CurationV2ListResponse> => {
    const response = await apiClient.getWithMeta<CurationV2ListItem[]>(
      CurationV2Api.list.endpoint,
      { params }
    );

    return {
      items: response.data ?? [],
      meta: {
        page: response.meta.page ?? params?.page ?? 0,
        size: response.meta.size ?? params?.size ?? 20,
        totalElements: response.meta.totalElements ?? 0,
        totalPages: response.meta.totalPages ?? 0,
        hasNext: response.meta.hasNext ?? false,
      },
    };
  },

  /**
   * Spec 기반 큐레이션 상세 조회
   */
  getDetail: async (curationId: number): Promise<CurationV2Detail> => {
    const endpoint = CurationV2Api.detail.endpoint.replace(':curationId', String(curationId));
    return apiClient.get<CurationV2Detail>(endpoint);
  },

  /**
   * Spec 기반 큐레이션 생성
   */
  create: async (data: CurationV2CreateRequest): Promise<CurationV2CreateResponse> => {
    return apiClient.post<CurationV2CreateResponse, CurationV2CreateRequest>(
      CurationV2Api.create.endpoint,
      data
    );
  },

  /**
   * Spec 기반 큐레이션 수정
   */
  update: async (
    curationId: number,
    data: CurationV2UpdateRequest
  ): Promise<CurationV2UpdateResponse> => {
    const endpoint = CurationV2Api.update.endpoint.replace(':curationId', String(curationId));
    return apiClient.put<CurationV2UpdateResponse, CurationV2UpdateRequest>(endpoint, data);
  },
};
