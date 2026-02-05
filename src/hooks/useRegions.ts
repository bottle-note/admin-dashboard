/**
 * Region API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  regionService,
  regionKeys,
  type RegionListResponse,
} from '@/services/region.service';
import type { RegionSearchParams } from '@/types/api';

/**
 * 지역 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRegionList();
 *
 * if (data) {
 *   console.log(data.items);  // 지역 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useRegionList(params?: RegionSearchParams) {
  return useApiQuery<RegionListResponse>(
    regionKeys.list(params),
    () => regionService.list(params),
    {
      staleTime: 1000 * 60 * 5, // 5분 (지역 데이터는 자주 변경되지 않음)
    }
  );
}
