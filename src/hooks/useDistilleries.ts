/**
 * Distillery API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  distilleryService,
  distilleryKeys,
  type DistilleryListResponse,
} from '@/services/distillery.service';
import type { DistillerySearchParams } from '@/types/api';

/**
 * 증류소 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDistilleryList();
 *
 * if (data) {
 *   console.log(data.items);  // 증류소 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useDistilleryList(params?: DistillerySearchParams) {
  return useApiQuery<DistilleryListResponse>(
    distilleryKeys.list(params),
    () => distilleryService.list(params),
    {
      staleTime: 1000 * 60 * 5, // 5분 (증류소 데이터는 자주 변경되지 않음)
    }
  );
}
