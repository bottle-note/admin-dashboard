/**
 * API Query 훅
 * TanStack Query의 useQuery를 래핑하여 타입 안전성과 에러 처리 제공
 */

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { useToast } from './useToast';

// ============================================
// Types
// ============================================

export type UseApiQueryOptions<TData = unknown> = Omit<
  UseQueryOptions<TData, ApiError, TData, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  /**
   * 에러 발생 시 자동으로 Toast 표시 여부
   * @default true
   */
  showErrorToast?: boolean;
};

// ============================================
// useApiQuery Hook
// ============================================

/**
 * API 요청을 위한 Query 훅
 * 자동 에러 Toast 표시 기능 포함
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery(
 *   ['alcohols', { category: 'SINGLE_MALT' }],
 *   () => alcoholService.search({ category: 'SINGLE_MALT' })
 * );
 * ```
 */
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseApiQueryOptions<TData>
): UseQueryResult<TData, ApiError> {
  const { showErrorToast = true, ...queryOptions } = options ?? {};
  const { showToast } = useToast();

  return useQuery<TData, ApiError, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        // 에러 Toast 표시
        if (showErrorToast) {
          showToast({
            type: 'error',
            message: getErrorMessage(error),
          });
        }
        throw error;
      }
    },
    ...queryOptions,
  });
}

// ============================================
// Query Key Factory Helper
// ============================================

/**
 * 일관된 Query Key 생성을 위한 팩토리 헬퍼
 *
 * @example
 * ```ts
 * const alcoholKeys = createQueryKeys('alcohols');
 * // alcoholKeys.all → ['alcohols']
 * // alcoholKeys.lists() → ['alcohols', 'list']
 * // alcoholKeys.list({ category: 'SINGLE_MALT' }) → ['alcohols', 'list', { category: 'SINGLE_MALT' }]
 * // alcoholKeys.details() → ['alcohols', 'detail']
 * // alcoholKeys.detail(123) → ['alcohols', 'detail', 123]
 * ```
 */
export function createQueryKeys<T extends string>(namespace: T) {
  return {
    all: [namespace] as const,
    lists: () => [...createQueryKeys(namespace).all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? ([...createQueryKeys(namespace).lists(), params] as const)
        : createQueryKeys(namespace).lists(),
    details: () => [...createQueryKeys(namespace).all, 'detail'] as const,
    detail: (id: string | number) =>
      [...createQueryKeys(namespace).details(), id] as const,
  };
}
