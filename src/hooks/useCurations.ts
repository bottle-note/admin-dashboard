/**
 * Spec 기반 큐레이션 API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';

import {
  cacheCurationSpecDetail,
  CURATION_SPEC_QUERY_GC_MS,
  CURATION_SPEC_REVALIDATE_AFTER_MS,
  getCachedCurationSpecDetail,
  readCurationSpecBrowserCache,
  reconcileCurationSpecManifest,
  writeCurationSpecBrowserCache,
} from '@/lib/curation-spec-browser-cache';
import { useAuthStore } from '@/stores/auth';
import { useApiQuery, type UseApiQueryOptions } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  curationKeys,
  curationService,
  type CurationListResponse,
} from '@/services/curation.service';
import type {
  CurationV2CreateRequest,
  CurationV2CreateResponse,
  CurationV2Detail,
  CurationV2SearchParams,
  CurationV2Spec,
  CurationV2SpecListItem,
  CurationV2UpdateRequest,
  CurationV2UpdateResponse,
} from '@/types/api';

/**
 * 큐레이션 스펙 목록 조회 훅
 *
 * 목록 API는 version manifest로 사용한다. 브라우저 cache가 1시간 이내면 즉시 복원하고,
 * stale 상태 또는 탭 재포커스 때만 목록을 다시 조회해 상세 schema cache를 정리한다.
 */
export function useCurationSpecs() {
  const adminId = useAuthStore((state) => state.user?.adminId);
  const browserCache = adminId ? readCurationSpecBrowserCache(adminId) : null;

  return useApiQuery<CurationV2SpecListItem[]>(
    curationKeys.specs(adminId ?? 0),
    async () => {
      const specs = await curationService.listSpecs();

      if (adminId) {
        const checkedAt = Date.now();
        const reconciledCache = reconcileCurationSpecManifest(
          readCurationSpecBrowserCache(adminId),
          specs,
          checkedAt
        );
        writeCurationSpecBrowserCache(adminId, reconciledCache);
      }

      return specs;
    },
    {
      staleTime: CURATION_SPEC_REVALIDATE_AFTER_MS,
      gcTime: CURATION_SPEC_QUERY_GC_MS,
      refetchOnWindowFocus: true,
      initialData: browserCache?.specs,
      initialDataUpdatedAt: browserCache?.checkedAt,
    }
  );
}

/**
 * 큐레이션 스펙 상세 조회 훅
 *
 * 상세 query key에 version을 포함해 manifest version이 바뀌면 기존 TanStack Query data도
 * 재사용하지 않는다. 현재 version의 browser cache가 있으면 상세 API 요청을 생략한다.
 */
export function useCurationSpec(
  specId: number | undefined,
  version: number | undefined,
  options?: UseApiQueryOptions<CurationV2Spec>
) {
  const adminId = useAuthStore((state) => state.user?.adminId);
  const browserCache = adminId ? readCurationSpecBrowserCache(adminId) : null;
  const cachedDetail =
    specId && version ? getCachedCurationSpecDetail(browserCache, specId, version) : null;
  const { enabled: isEnabled = true, ...restOptions } = options ?? {};

  return useApiQuery<CurationV2Spec>(
    curationKeys.spec(adminId ?? 0, specId ?? 0, version ?? 0),
    async () => {
      const spec = await curationService.getSpec(specId!);

      if (adminId && spec.version === version) {
        const nextCache = cacheCurationSpecDetail(
          readCurationSpecBrowserCache(adminId),
          spec,
          Date.now()
        );
        writeCurationSpecBrowserCache(adminId, nextCache);
      }

      return spec;
    },
    {
      ...restOptions,
      enabled: !!specId && specId > 0 && !!version && isEnabled,
      staleTime: Infinity,
      gcTime: CURATION_SPEC_QUERY_GC_MS,
      initialData: cachedDetail?.data,
      initialDataUpdatedAt: cachedDetail?.cachedAt,
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
