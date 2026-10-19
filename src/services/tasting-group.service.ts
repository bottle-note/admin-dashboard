/**
 * 태그 그룹(맛 그룹) API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  TastingGroupApi,
  type TastingGroupItem,
  type TastingGroupListResponse,
  type TastingGroupCreateRequest,
  type TastingGroupUpdateRequest,
  type TastingGroupTagsRequest,
  type TastingGroupTagRoleRequest,
  type TastingGroupResultResponse,
  type UngroupedTastingTag,
  type UngroupedTastingTagParams,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

const baseKeys = createQueryKeys('tasting-groups');

export const tastingGroupKeys = {
  ...baseKeys,
  /** 미소속 태그 조회. 그룹 변경 시 함께 무효화되도록 같은 namespace를 쓴다 */
  ungrouped: (keyword?: string) => [...baseKeys.all, 'ungrouped', keyword ?? ''] as const,
};

// ============================================
// Service
// ============================================

export const tastingGroupService = {
  /** 태그 그룹 전체 목록 (태그 연결·계열 포함) */
  list: async (): Promise<TastingGroupListResponse> => {
    const response = await apiClient.get<TastingGroupListResponse>(TastingGroupApi.list.endpoint);
    return response.data;
  },

  /** 태그 그룹 상세 */
  detail: async (code: string): Promise<TastingGroupItem> => {
    const endpoint = TastingGroupApi.detail.endpoint.replace(':code', encodeURIComponent(code));
    const response = await apiClient.get<TastingGroupItem>(endpoint);
    return response.data;
  },

  /** 태그 그룹 생성 */
  create: (data: TastingGroupCreateRequest): Promise<TastingGroupResultResponse> => {
    return apiClient.post<TastingGroupResultResponse, TastingGroupCreateRequest>(
      TastingGroupApi.create.endpoint,
      data
    );
  },

  /** 태그 그룹 수정 */
  update: (code: string, data: TastingGroupUpdateRequest): Promise<TastingGroupResultResponse> => {
    const endpoint = TastingGroupApi.update.endpoint.replace(':code', encodeURIComponent(code));
    return apiClient.put<TastingGroupResultResponse, TastingGroupUpdateRequest>(endpoint, data);
  },

  /** 태그 그룹 삭제. 태그가 연결돼 있으면 서버가 409로 거절한다 */
  delete: (code: string): Promise<TastingGroupResultResponse> => {
    const endpoint = TastingGroupApi.delete.endpoint.replace(':code', encodeURIComponent(code));
    return apiClient.delete<TastingGroupResultResponse>(endpoint);
  },

  /** 태그 그룹에 태그 연결 (이미 있으면 역할만 바뀐다) */
  addTags: (code: string, data: TastingGroupTagsRequest): Promise<TastingGroupResultResponse> => {
    const endpoint = TastingGroupApi.addTags.endpoint.replace(':code', encodeURIComponent(code));
    return apiClient.post<TastingGroupResultResponse, TastingGroupTagsRequest>(endpoint, data);
  },

  /** 태그 그룹 태그의 역할 변경 */
  changeTagRole: (
    code: string,
    tagId: number,
    data: TastingGroupTagRoleRequest
  ): Promise<TastingGroupResultResponse> => {
    const endpoint = TastingGroupApi.changeTagRole.endpoint
      .replace(':code', encodeURIComponent(code))
      .replace(':tagId', String(tagId));
    return apiClient.put<TastingGroupResultResponse, TastingGroupTagRoleRequest>(endpoint, data);
  },

  /** 태그 그룹에서 태그 제거 */
  removeTag: (code: string, tagId: number): Promise<TastingGroupResultResponse> => {
    const endpoint = TastingGroupApi.removeTag.endpoint
      .replace(':code', encodeURIComponent(code))
      .replace(':tagId', String(tagId));
    return apiClient.delete<TastingGroupResultResponse>(endpoint);
  },

  /** 어느 그룹에도 속하지 않은 테이스팅 태그 */
  ungroupedTags: async (params?: UngroupedTastingTagParams): Promise<UngroupedTastingTag[]> => {
    const response = await apiClient.get<UngroupedTastingTag[]>(
      TastingGroupApi.ungroupedTags.endpoint,
      { params: params?.keyword ? { keyword: params.keyword } : undefined }
    );
    return response.data ?? [];
  },
};
