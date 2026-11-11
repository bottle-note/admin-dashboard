import { createQueryKeys } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/api-client';
import {
  AlcoholMergeApi,
  type AlcoholMergeRequest,
  type AlcoholMergePreview,
  type AlcoholMergeResult,
  type AlcoholMergeLog,
  type AlcoholMergeLogParams,
  type AlcoholMergePageMeta,
  type AlcoholMergeLogList,
} from '@/types/api';

export const adminAlcoholMergeKeys = createQueryKeys('admin-alcohol-merges');

export const adminAlcoholMergeService = {
  preview: (request: AlcoholMergeRequest): Promise<AlcoholMergePreview> =>
    apiClient.post<AlcoholMergePreview, AlcoholMergeRequest>(
      AlcoholMergeApi.preview.endpoint,
      request
    ),

  merge: (request: AlcoholMergeRequest): Promise<AlcoholMergeResult> =>
    apiClient.post<AlcoholMergeResult, AlcoholMergeRequest>(
      AlcoholMergeApi.merge.endpoint,
      request
    ),

  list: async (
    params: AlcoholMergeLogParams = {},
    signal?: AbortSignal
  ): Promise<AlcoholMergeLogList> => {
    const response = await apiClient.get<AlcoholMergeLog[], AlcoholMergePageMeta>(
      AlcoholMergeApi.list.endpoint,
      { params, signal }
    );
    return { items: response.data, meta: response.meta };
  },
};
