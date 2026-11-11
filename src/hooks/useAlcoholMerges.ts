import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import { adminAlcoholKeys } from '@/services/admin-alcohol.service';
import {
  adminAlcoholMergeKeys,
  adminAlcoholMergeService,
} from '@/services/admin-alcohol-merge.service';
import type { AlcoholMergeLogParams, AlcoholMergeRequest, AlcoholMergeResult } from '@/types/api';

export function useAlcoholMergeLogs(params: AlcoholMergeLogParams, enabled = true) {
  return useApiQuery(
    adminAlcoholMergeKeys.list({ ...params }),
    ({ signal }) => adminAlcoholMergeService.list(params, signal),
    { enabled, showErrorToast: false }
  );
}

export function useAlcoholMergePreview() {
  return useApiMutation(adminAlcoholMergeService.preview, {
    showErrorToast: false,
    retry: false,
  });
}

type MergeOptions = Omit<
  UseApiMutationOptions<AlcoholMergeResult, AlcoholMergeRequest>,
  'retry' | 'invalidateKeys' | 'successMessage'
>;

export function useAlcoholMerge(options?: MergeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation(adminAlcoholMergeService.merge, {
    ...restOptions,
    showErrorToast: false,
    // 응답을 잃어도 같은 병합 요청을 자동으로 반복하지 않는다.
    retry: false,
    successMessage: '위스키가 병합되었습니다.',
    invalidateKeys: [adminAlcoholKeys.all, adminAlcoholMergeKeys.all],
    onSuccess: async (data, variables, context, mutationContext) => {
      for (const id of variables.duplicateAlcoholIds) {
        queryClient.removeQueries({ queryKey: adminAlcoholKeys.detail(id), exact: true });
      }
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}
