/**
 * 큐레이션 관련 React Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { curationService } from '@/services/curation.service';
import type { CurationListItem } from '@/data/mock/curations.mock';

// Query Keys
export const curationKeys = {
  all: ['curations'] as const,
  list: () => [...curationKeys.all, 'list'] as const,
  detail: (id: number) => [...curationKeys.all, 'detail', id] as const,
};

/**
 * 큐레이션 목록 조회 훅
 */
export function useCurationList() {
  return useQuery<CurationListItem[]>({
    queryKey: curationKeys.list(),
    queryFn: curationService.getCurations,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 큐레이션 단일 조회 훅
 * @param id - 큐레이션 ID
 */
export function useCurationDetail(id: number | undefined) {
  return useQuery<CurationListItem | undefined>({
    queryKey: curationKeys.detail(id!),
    queryFn: () => curationService.getCurationById(id!),
    enabled: !!id,
  });
}

// Re-export for convenience
export { curationService };
export type { CurationListItem };
