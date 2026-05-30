/**
 * Spec 기반 큐레이션 v2 API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';

import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  curationV2Keys,
  curationV2Service,
  resolveCurationV2SpecByCode,
  type CurationV2ListResponse,
} from '@/services/curation-v2.service';
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
export function useCurationV2Specs() {
  return useApiQuery<CurationV2Spec[]>(curationV2Keys.specs(), curationV2Service.listSpecs, {
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 큐레이션 스펙 상세 조회 훅
 */
export function useCurationV2Spec(specId: number | undefined) {
  return useApiQuery<CurationV2Spec>(
    curationV2Keys.spec(specId ?? 0),
    () => curationV2Service.getSpec(specId!),
    {
      enabled: !!specId && specId > 0,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * 큐레이션 스펙 code 기준 조회 훅
 * specId는 환경별로 달라질 수 있으므로 code로 조회 후 런타임에 resolve한다.
 */
export function useCurationV2SpecByCode(specCode: CurationV2SpecCode | undefined) {
  return useApiQuery<CurationV2Spec | null>(
    curationV2Keys.specByCode(specCode ?? ''),
    async () => {
      const specs = await curationV2Service.listSpecs();
      return specCode ? resolveCurationV2SpecByCode(specs, specCode) : null;
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
export function useCurationV2List(params?: CurationV2SearchParams) {
  return useApiQuery<CurationV2ListResponse>(
    curationV2Keys.list(params),
    () => curationV2Service.list(params),
    {
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Spec 기반 큐레이션 상세 조회 훅
 */
export function useCurationV2Detail(curationId: number | undefined) {
  return useApiQuery<CurationV2Detail>(
    curationV2Keys.detail(curationId ?? 0),
    () => curationV2Service.getDetail(curationId!),
    {
      enabled: !!curationId && curationId > 0,
      staleTime: 1000 * 60 * 5,
    }
  );
}

/**
 * Spec 기반 큐레이션 생성 훅
 */
export function useCurationV2Create(
  options?: Omit<
    UseApiMutationOptions<CurationV2CreateResponse, CurationV2CreateRequest>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationV2CreateResponse, CurationV2CreateRequest>(
    curationV2Service.create,
    {
      successMessage: '큐레이션이 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: curationV2Keys.lists() });
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
export interface CurationV2UpdateVariables {
  curationId: number;
  data: CurationV2UpdateRequest;
}

/**
 * Spec 기반 큐레이션 수정 훅
 */
export function useCurationV2Update(
  options?: Omit<
    UseApiMutationOptions<CurationV2UpdateResponse, CurationV2UpdateVariables>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationV2UpdateResponse, CurationV2UpdateVariables>(
    ({ curationId, data }) => curationV2Service.update(curationId, data),
    {
      successMessage: '큐레이션이 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: curationV2Keys.lists() });
        queryClient.invalidateQueries({ queryKey: curationV2Keys.detail(variables.curationId) });
        if (onSuccess) {
          (
            onSuccess as (
              data: CurationV2UpdateResponse,
              variables: CurationV2UpdateVariables,
              context: unknown
            ) => void
          )(data, variables, context);
        }
      },
    }
  );
}
