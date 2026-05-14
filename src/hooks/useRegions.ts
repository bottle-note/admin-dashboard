/**
 * Region API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  regionService,
  regionKeys,
  type RegionListResponse,
} from '@/services/region.service';
import type {
  RegionSearchParams,
  RegionDetail,
  RegionFormData,
  RegionFormResponse,
  RegionDeleteResponse,
  RegionSortOrderRequest,
  RegionSortOrderResponse,
} from '@/types/api';

/**
 * 지역 목록 조회 훅
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

/**
 * 지역 상세 조회 훅
 */
export function useRegionDetail(id: number | undefined) {
  return useApiQuery<RegionDetail>(
    regionKeys.detail(id ?? 0),
    () => regionService.detail(id!),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * 지역 생성 훅
 */
export function useRegionCreate(
  options?: Omit<UseApiMutationOptions<RegionFormResponse, RegionFormData>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<RegionFormResponse, RegionFormData>(regionService.create, {
    successMessage: '지역이 등록되었습니다.',
    ...restOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      if (onSuccess) {
        (onSuccess as (
          data: RegionFormResponse,
          variables: RegionFormData,
          context: unknown
        ) => void)(data, variables, context);
      }
    },
  });
}

export interface RegionUpdateVariables {
  id: number;
  data: RegionFormData;
}

/**
 * 지역 수정 훅
 */
export function useRegionUpdate(
  options?: Omit<UseApiMutationOptions<RegionFormResponse, RegionUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<RegionFormResponse, RegionUpdateVariables>(
    ({ id, data }) => regionService.update(id, data),
    {
      successMessage: '지역이 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
        queryClient.invalidateQueries({ queryKey: regionKeys.details() });
        if (onSuccess) {
          (onSuccess as (
            data: RegionFormResponse,
            variables: RegionUpdateVariables,
            context: unknown
          ) => void)(data, variables, context);
        }
      },
    }
  );
}

export interface RegionSortOrderVariables {
  id: number;
  data: RegionSortOrderRequest;
}

/**
 * 지역 정렬 순서 변경 훅
 */
export function useRegionSortOrderUpdate(
  options?: Omit<
    UseApiMutationOptions<RegionSortOrderResponse, RegionSortOrderVariables>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<RegionSortOrderResponse, RegionSortOrderVariables>(
    ({ id, data }) => regionService.updateSortOrder(id, data),
    {
      // drag&drop 시 여러 번 호출되므로 토스트 메시지는 호출자에서 제어
      successMessage: '',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
        queryClient.invalidateQueries({ queryKey: regionKeys.details() });
        if (onSuccess) {
          (onSuccess as (
            data: RegionSortOrderResponse,
            variables: RegionSortOrderVariables,
            context: unknown
          ) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 지역 삭제 훅
 */
export function useRegionDelete(
  options?: Omit<UseApiMutationOptions<RegionDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<RegionDeleteResponse, number>(regionService.delete, {
    successMessage: '지역이 삭제되었습니다.',
    ...restOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      if (onSuccess) {
        (onSuccess as (
          data: RegionDeleteResponse,
          variables: number,
          context: unknown
        ) => void)(data, variables, context);
      }
    },
  });
}
