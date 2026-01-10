/**
 * 어드민 Alcohol API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  adminAlcoholService,
  adminAlcoholKeys,
  type AlcoholListResponse,
} from '@/services/admin-alcohol.service';
import type { AlcoholSearchParams } from '@/types/api';

/**
 * 술 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdminAlcoholList({ category: 'SINGLE_MALT' });
 *
 * if (data) {
 *   console.log(data.items);  // 술 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useAdminAlcoholList(params?: AlcoholSearchParams) {
  return useApiQuery<AlcoholListResponse>(
    adminAlcoholKeys.list(params),
    () => adminAlcoholService.search(params),
    {
      // 캐시 유지 시간 설정
      staleTime: 1000 * 60, // 1분
    }
  );
}
