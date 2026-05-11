/**
 * 사용자 API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  userService,
  userKeys,
  type UserListResponse,
} from '@/services/user.service';
import type { UserSearchParams } from '@/types/api';

/**
 * 사용자 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUserList({ keyword: 'test', status: 'ACTIVE' });
 *
 * if (data) {
 *   console.log(data.items);  // 사용자 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useUserList(params?: UserSearchParams) {
  return useApiQuery<UserListResponse>(
    userKeys.list(params),
    () => userService.list(params),
    {
      staleTime: 1000 * 60 * 5, // 5분
    }
  );
}
