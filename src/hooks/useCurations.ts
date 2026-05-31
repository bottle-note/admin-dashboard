/**
 * Spec 기반 큐레이션 API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';

import { useApiQuery, type UseApiQueryOptions } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  curationKeys,
  curationService,
  resolveCurationSpecByCode,
  type CurationListResponse,
} from '@/services/curation.service';
import type {
  CurationV2CreateRequest,
  CurationV2CreateResponse,
  CurationV2Detail,
  CurationV2SearchParams,
  CurationV2Spec,
  CurationV2SpecCode,
  CurationV2UpdateRequest,
  CurationV2UpdateResponse,
} from '@/types/api';

/**
 * 큐레이션 스펙 목록 조회 훅
 */
export function useCurationSpecs() {
  return useApiQuery<CurationV2Spec[]>(curationKeys.specs(), curationService.listSpecs, {
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 큐레이션 스펙 상세 조회 훅
 */
export function useCurationSpec(
  specId: number | undefined,
  options?: UseApiQueryOptions<CurationV2Spec>
) {
  return useApiQuery<CurationV2Spec>(
    curationKeys.spec(specId ?? 0),
    () => curationService.getSpec(specId!),
    {
      enabled: !!specId && specId > 0,
      staleTime: 1000 * 60 * 5,
      ...options,
    }
  );
}

/**
 * 큐레이션 스펙 code 기준 조회 훅
 * specId는 환경별로 달라질 수 있으므로 code로 조회 후 런타임에 resolve한다.
 */
export function useCurationSpecByCode(specCode: CurationV2SpecCode | undefined) {
  return useApiQuery<CurationV2Spec | null>(
    curationKeys.specByCode(specCode ?? ''),
    async () => {
      const specs = await curationService.listSpecs();
      return specCode ? resolveCurationSpecByCode(specs, specCode) : null;
    },
    {
      enabled: !!specCode,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Spec 기반 큐레이션 목록 조회 훅
 */
export function useCurationList(params?: CurationV2SearchParams) {
  return useApiQuery<CurationListResponse>(
    curationKeys.list(params),
    () => curationService.list(params),
    {
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Spec 기반 큐레이션 상세 조회 훅
 */
export function useCurationDetail(curationId: number | undefined) {
  return useApiQuery<CurationV2Detail>(
    curationKeys.detail(curationId ?? 0),
    () => curationService.getDetail(curationId!),
    {
      enabled: !!curationId && curationId > 0,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Spec 기반 큐레이션 생성 훅
 */
export function useCurationCreate(
  options?: UseApiMutationOptions<CurationV2CreateResponse, CurationV2CreateRequest>
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    successMessage = '큐레이션이 등록되었습니다.',
    ...restOptions
  } = options ?? {};

  return useApiMutation<CurationV2CreateResponse, CurationV2CreateRequest>(
    curationService.create,
    {
      successMessage,
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        if (onSuccess) {
          (
            onSuccess as (
              data: CurationV2CreateResponse,
              variables: CurationV2CreateRequest,
              context: unknown
            ) => void
          )(data, variables, context);
        }
      },
    }
  );
}

/**
 * Spec 기반 큐레이션 수정 mutation 변수 타입
 */
export interface CurationUpdateVariables {
  curationId: number;
  data: CurationV2UpdateRequest;
}

/**
 * Spec 기반 큐레이션 수정 훅
 */
export function useCurationUpdate(
  options?: Omit<
    UseApiMutationOptions<CurationV2UpdateResponse, CurationUpdateVariables>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationV2UpdateResponse, CurationUpdateVariables>(
    ({ curationId, data }) => curationService.update(curationId, data),
    {
      successMessage: '큐레이션이 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables.curationId) });
        if (onSuccess) {
          (
            onSuccess as (
              data: CurationV2UpdateResponse,
              variables: CurationUpdateVariables,
              context: unknown
            ) => void
          )(data, variables, context);
        }
      },
    }
  );
}
