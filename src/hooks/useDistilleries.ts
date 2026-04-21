/**
 * Distillery API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  distilleryService,
  distilleryKeys,
  type DistilleryListResponse,
} from '@/services/distillery.service';
import type {
  DistillerySearchParams,
  DistilleryDetail,
  DistilleryFormData,
  DistilleryFormResponse,
  DistilleryDeleteResponse,
} from '@/types/api';

/**
 * 증류소 목록 조회 훅
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

/**
 * 증류소 상세 조회 훅
 */
export function useDistilleryDetail(id: number | undefined) {
  return useApiQuery<DistilleryDetail>(
    distilleryKeys.detail(id ?? 0),
    () => distilleryService.detail(id!),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * 증류소 생성 훅
 */
export function useDistilleryCreate(
  options?: Omit<
    UseApiMutationOptions<DistilleryFormResponse, DistilleryFormData>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<DistilleryFormResponse, DistilleryFormData>(
    distilleryService.create,
    {
      successMessage: '증류소가 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: distilleryKeys.lists() });
        if (onSuccess) {
          (onSuccess as (data: DistilleryFormResponse, variables: DistilleryFormData, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

export interface DistilleryUpdateVariables {
  id: number;
  data: DistilleryFormData;
}

/**
 * 증류소 수정 훅
 */
export function useDistilleryUpdate(
  options?: Omit<UseApiMutationOptions<DistilleryFormResponse, DistilleryUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<DistilleryFormResponse, DistilleryUpdateVariables>(
    ({ id, data }) => distilleryService.update(id, data),
    {
      successMessage: '증류소가 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: distilleryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: distilleryKeys.details() });
        if (onSuccess) {
          (onSuccess as (data: DistilleryFormResponse, variables: DistilleryUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 증류소 삭제 훅
 */
export function useDistilleryDelete(
  options?: Omit<UseApiMutationOptions<DistilleryDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<DistilleryDeleteResponse, number>(
    distilleryService.delete,
    {
      successMessage: '증류소가 삭제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: distilleryKeys.lists() });
        if (onSuccess) {
          (onSuccess as (data: DistilleryDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}
