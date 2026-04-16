/**
 * 사용자 API 서비스
 */

import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  UserApi,
  type UserSearchParams,
  type UserListItem,
  type UserPageMeta,
} from '@/types/api';

// ============================================
// Query Keys
// ============================================

export const userKeys = createQueryKeys('users');

// ============================================
// 응답 타입 (페이지네이션 포함)
// ============================================

export interface UserListResponse {
  items: UserListItem[];
  meta: UserPageMeta;
}

// ============================================
// Service
// ============================================

export const userService = {
  /**
   * 사용자 목록 조회
   * 페이지 기반 페이지네이션 (meta에 페이지 정보 포함)
   */
  list: async (params?: UserSearchParams): Promise<UserListResponse> => {
    const response = await apiClient.getWithMeta<UserListItem[]>(
      UserApi.list.endpoint,
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
};
