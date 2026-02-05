/**
 * 배너 API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  bannerService,
  bannerKeys,
  type BannerListResponse,
} from '@/services/banner.service';
import type {
  BannerSearchParams,
  BannerDetail,
  BannerCreateRequest,
  BannerCreateResponse,
  BannerUpdateRequest,
  BannerUpdateResponse,
  BannerDeleteResponse,
  BannerReorderRequest,
  BannerReorderResponse,
} from '@/types/api';

/**
 * 배너 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBannerList({ bannerType: 'CURATION' });
 *
 * if (data) {
 *   console.log(data.items);  // 배너 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useBannerList(params?: BannerSearchParams) {
  return useApiQuery<BannerListResponse>(
    bannerKeys.list(params),
    () => bannerService.search(params),
    {
      staleTime: 1000 * 60, // 1분
    }
  );
}

/**
 * 배너 상세 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBannerDetail(1);
 *
 * if (data) {
 *   console.log(data.name);         // 배너명
 *   console.log(data.bannerType);   // 배너 타입
 * }
 * ```
 */
export function useBannerDetail(bannerId: number | undefined) {
  return useApiQuery<BannerDetail>(
    bannerKeys.detail(bannerId ?? 0),
    () => bannerService.getDetail(bannerId!),
    {
      enabled: !!bannerId && bannerId > 0,
      staleTime: 1000 * 60, // 1분
    }
  );
}

/**
 * 배너 생성 훅
 *
 * @example
 * ```tsx
 * const createMutation = useBannerCreate({
 *   onSuccess: (data) => {
 *     console.log('생성된 ID:', data.targetId);
 *     navigate('/banners');
 *   },
 * });
 *
 * createMutation.mutate({
 *   name: '신규 배너',
 *   bannerType: 'CURATION',
 *   // ...
 * });
 * ```
 */
export function useBannerCreate(
  options?: Omit<
    UseApiMutationOptions<BannerCreateResponse, BannerCreateRequest>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerCreateResponse, BannerCreateRequest>(
    bannerService.create,
    {
      successMessage: '배너가 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: BannerCreateResponse, variables: BannerCreateRequest, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 수정 mutation 변수 타입
 */
export interface BannerUpdateVariables {
  bannerId: number;
  data: BannerUpdateRequest;
}

/**
 * 배너 수정 훅
 *
 * @example
 * ```tsx
 * const updateMutation = useBannerUpdate({
 *   onSuccess: () => {
 *     console.log('수정 완료');
 *   },
 * });
 *
 * updateMutation.mutate({
 *   bannerId: 1,
 *   data: {
 *     name: '수정된 배너',
 *     bannerType: 'AD',
 *     // ...
 *   },
 * });
 * ```
 */
export function useBannerUpdate(
  options?: Omit<UseApiMutationOptions<BannerUpdateResponse, BannerUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerUpdateResponse, BannerUpdateVariables>(
    ({ bannerId, data }) => bannerService.update(bannerId, data),
    {
      successMessage: '배너가 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.detail(variables.bannerId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: BannerUpdateResponse, variables: BannerUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 삭제 훅
 *
 * @example
 * ```tsx
 * const deleteMutation = useBannerDelete({
 *   onSuccess: () => {
 *     navigate('/banners');
 *   },
 * });
 *
 * deleteMutation.mutate(bannerId);
 * ```
 */
export function useBannerDelete(
  options?: Omit<UseApiMutationOptions<BannerDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerDeleteResponse, number>(
    bannerService.delete,
    {
      successMessage: '배너가 삭제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.detail(variables) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: BannerDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 순서 변경 훅
 *
 * @example
 * ```tsx
 * const reorderMutation = useBannerReorder({
 *   onSuccess: () => {
 *     console.log('순서 변경 완료');
 *   },
 * });
 *
 * reorderMutation.mutate({ bannerIds: [3, 1, 2] });
 * ```
 */
export function useBannerReorder(
  options?: Omit<UseApiMutationOptions<BannerReorderResponse, BannerReorderRequest>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerReorderResponse, BannerReorderRequest>(
    bannerService.reorder,
    {
      successMessage: '배너 순서가 변경되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: BannerReorderResponse, variables: BannerReorderRequest, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}
