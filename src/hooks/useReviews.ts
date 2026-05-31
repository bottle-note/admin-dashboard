/**
 * 리뷰 API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  reviewService,
  reviewKeys,
  type ReviewListResponse,
} from '@/services/review.service';
import type { ReviewSearchParams } from '@/types/api';

/**
 * 리뷰 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useReviewList({ keyword: '맛있다', activeStatus: 'ACTIVE' });
 *
 * if (data) {
 *   console.log(data.items);  // 리뷰 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useReviewList(params?: ReviewSearchParams) {
  return useApiQuery<ReviewListResponse>(
    reviewKeys.list(params),
    () => reviewService.list(params),
    {
      staleTime: 1000 * 60 * 5, // 5분
    }
  );
}
