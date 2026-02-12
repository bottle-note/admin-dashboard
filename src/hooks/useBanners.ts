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
  BannerUpdateStatusRequest,
  BannerUpdateStatusResponse,
  BannerUpdateSortOrderRequest,
  BannerUpdateSortOrderResponse,
} from '@/types/api';

/**
 * 배너 목록 조회 훅
 */
export function useBannerList(params?: BannerSearchParams) {
  return useApiQuery<BannerListResponse>(
    bannerKeys.list(params),
    () => bannerService.search(params),
    {
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * 배너 상세 조회 훅
 */
export function useBannerDetail(id: number | undefined) {
  return useApiQuery<BannerDetail>(
    bannerKeys.detail(id ?? 0),
    () => bannerService.getDetail(id!),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * 배너 생성 훅
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
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
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
  id: number;
  data: BannerUpdateRequest;
}

/**
 * 배너 수정 훅
 */
export function useBannerUpdate(
  options?: Omit<UseApiMutationOptions<BannerUpdateResponse, BannerUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerUpdateResponse, BannerUpdateVariables>(
    ({ id, data }) => bannerService.update(id, data),
    {
      successMessage: '배너가 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        queryClient.invalidateQueries({ queryKey: bannerKeys.detail(variables.id) });
        if (onSuccess) {
          (onSuccess as (data: BannerUpdateResponse, variables: BannerUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 삭제 훅
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
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        if (onSuccess) {
          (onSuccess as (data: BannerDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 상태 변경 mutation 변수 타입
 */
export interface BannerUpdateStatusVariables {
  bannerId: number;
  data: BannerUpdateStatusRequest;
}

/**
 * 배너 상태 변경 훅 (활성/비활성)
 */
export function useBannerUpdateStatus(
  options?: Omit<UseApiMutationOptions<BannerUpdateStatusResponse, BannerUpdateStatusVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerUpdateStatusResponse, BannerUpdateStatusVariables>(
    ({ bannerId, data }) => bannerService.updateStatus(bannerId, data),
    {
      successMessage: '배너 상태가 변경되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        queryClient.invalidateQueries({ queryKey: bannerKeys.detail(variables.bannerId) });
        if (onSuccess) {
          (onSuccess as (data: BannerUpdateStatusResponse, variables: BannerUpdateStatusVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 배너 정렬순서 변경 mutation 변수 타입
 */
export interface BannerUpdateSortOrderVariables {
  bannerId: number;
  data: BannerUpdateSortOrderRequest;
}

/**
 * 배너 정렬순서 변경 훅
 */
export function useBannerUpdateSortOrder(
  options?: Omit<UseApiMutationOptions<BannerUpdateSortOrderResponse, BannerUpdateSortOrderVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<BannerUpdateSortOrderResponse, BannerUpdateSortOrderVariables>(
    ({ bannerId, data }) => bannerService.updateSortOrder(bannerId, data),
    {
      successMessage: '배너 순서가 변경되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
        queryClient.invalidateQueries({ queryKey: bannerKeys.detail(variables.bannerId) });
        if (onSuccess) {
          (onSuccess as (data: BannerUpdateSortOrderResponse, variables: BannerUpdateSortOrderVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}
