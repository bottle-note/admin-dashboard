/**
 * Infinite API Query 훅
 * 커서 기반 페이지네이션을 위한 무한 스크롤 Query 훅
 */

import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Pageable } from '@/types/api';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { useToast } from './useToast';

// ============================================
// Types
// ============================================

/**
 * 무한 스크롤 응답 타입
 */
export interface InfiniteApiResponse<T> {
  items: T[];
  pageable: Pageable;
}

export interface UseInfiniteApiQueryOptions {
  /**
   * 에러 발생 시 자동으로 Toast 표시 여부
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * 쿼리 활성화 여부
   */
  enabled?: boolean;
  /**
   * stale time (ms)
   */
  staleTime?: number;
  /**
   * gc time (ms)
   */
  gcTime?: number;
}

// ============================================
// useInfiniteApiQuery Hook
// ============================================

/**
 * 커서 기반 무한 스크롤 Query 훅
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteApiQuery(
 *   ['alcohols', 'list', { category: 'SINGLE_MALT' }],
 *   (cursor) => alcoholService.search({ category: 'SINGLE_MALT', cursor })
 * );
 *
 * // 모든 아이템 가져오기
 * const allItems = flattenInfiniteData(data);
 * ```
 */
export function useInfiniteApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: (cursor?: number) => Promise<InfiniteApiResponse<TData>>,
  options?: UseInfiniteApiQueryOptions
): UseInfiniteQueryResult<InfiniteData<InfiniteApiResponse<TData>>, ApiError> {
  const { showErrorToast = true, enabled, staleTime, gcTime } = options ?? {};
  const { showToast } = useToast();

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | undefined }) => {
      try {
        return await queryFn(pageParam);
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
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: InfiniteApiResponse<TData>) =>
      lastPage.pageable.hasNext ? lastPage.pageable.cursor : undefined,
    enabled,
    staleTime,
    gcTime,
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * 무한 스크롤 데이터를 단일 배열로 평탄화
 *
 * @example
 * ```tsx
 * const allItems = flattenInfiniteData(data);
 * ```
 */
export function flattenInfiniteData<T>(
  data: InfiniteData<InfiniteApiResponse<T>> | undefined
): T[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}

/**
 * 전체 아이템 수 계산
 */
export function getTotalCount<T>(
  data: InfiniteData<InfiniteApiResponse<T>> | undefined
): number {
  if (!data) return 0;
  return data.pages.reduce((sum, page) => sum + page.items.length, 0);
}
