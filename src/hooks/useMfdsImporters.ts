import type { InfiniteData } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import {
  flattenInfiniteData,
  useInfiniteApiQuery,
  type InfiniteApiResponse,
} from './useInfiniteApiQuery';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import { mfdsImporterKeys, mfdsImporterService } from '@/services/mfds-importer.service';
import type {
  MfdsImporterCreateRequest,
  MfdsImporterItem,
  MfdsImporterSearchParams,
  MfdsImporterListMeta,
  MfdsImporterMutationResult,
  MfdsImporterUpdateRequest,
} from '@/types/api';

export function useMfdsImporterList(params?: MfdsImporterSearchParams) {
  return useApiQuery<{ items: MfdsImporterItem[]; meta: MfdsImporterListMeta }>(
    mfdsImporterKeys.list(params ? { ...params } : undefined),
    () => mfdsImporterService.list(params)
  );
}

export function useMfdsImporterLookupInfinite(
  params?: Omit<MfdsImporterSearchParams, 'cursor'>,
  options: { enabled?: boolean } = {}
) {
  return useInfiniteApiQuery(
    mfdsImporterKeys.list(params ? { ...params, lookup: true } : { lookup: true }),
    async (cursor) => {
      const response = await mfdsImporterService.list({ ...params, cursor });
      return {
        items: response.items,
        pageable: {
          currentCursor: cursor ?? 0,
          cursor: response.meta.nextCursor ?? 0,
          pageSize: params?.pageSize ?? 20,
          hasNext: response.meta.hasNext,
        },
      };
    },
    { enabled: options.enabled ?? true }
  );
}

export function flattenMfdsImporterPages(
  data: InfiniteData<InfiniteApiResponse<MfdsImporterItem>> | undefined
) {
  return flattenInfiniteData(data);
}

export function useMfdsImporterDetail(importerId: number | undefined) {
  const validImporterId = importerId !== undefined && importerId > 0 ? importerId : 0;

  return useApiQuery(
    mfdsImporterKeys.detail(validImporterId),
    () => mfdsImporterService.detail(validImporterId),
    { enabled: validImporterId > 0 }
  );
}

export function useMfdsImporterCreate() {
  const queryClient = useQueryClient();

  return useApiMutation<MfdsImporterMutationResult, MfdsImporterCreateRequest>(
    mfdsImporterService.create,
    {
      successMessage: '수입사를 등록했습니다.',
      onSuccess: () => queryClient.invalidateQueries({ queryKey: mfdsImporterKeys.lists() }),
    }
  );
}

export function useMfdsImporterUpdate() {
  const queryClient = useQueryClient();

  return useApiMutation<
    MfdsImporterMutationResult,
    { importerId: number; data: MfdsImporterUpdateRequest }
  >(
    ({ importerId, data }) => mfdsImporterService.update(importerId, data),
    {
      successMessage: '수입사 관리 정보를 저장했습니다.',
      onSuccess: (_, { importerId }) =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: mfdsImporterKeys.lists() }),
          queryClient.invalidateQueries({ queryKey: mfdsImporterKeys.detail(importerId) }),
        ]),
    }
  );
}

export function useMfdsImporterDelete(
  options?: Omit<UseApiMutationOptions<MfdsImporterMutationResult, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<MfdsImporterMutationResult, number>(mfdsImporterService.delete, {
    successMessage: '수입사를 삭제했습니다.',
    ...restOptions,
    onSuccess: (data, importerId, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: mfdsImporterKeys.lists() });
      if (onSuccess) {
        onSuccess(data, importerId, onMutateResult, context);
      }
    },
  });
}
