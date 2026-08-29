import { createQueryKeys } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/api-client';
import {
  MfdsImporterApi,
  type MfdsImporterItem,
  type MfdsImporterListMeta,
  type MfdsImporterCreateRequest,
  type MfdsImporterMutationResult,
  type MfdsImporterSearchParams,
  type MfdsImporterUpdateRequest,
} from '@/types/api';

export const mfdsImporterKeys = createQueryKeys('mfds-importers');

export interface MfdsImporterListResponse {
  items: MfdsImporterItem[];
  meta: MfdsImporterListMeta;
}

export const mfdsImporterService = {
  list: async (params?: MfdsImporterSearchParams): Promise<MfdsImporterListResponse> => {
    const response = await apiClient.get<MfdsImporterItem[], MfdsImporterListMeta>(
      MfdsImporterApi.list.endpoint,
      { params }
    );

    return {
      items: response.data ?? [],
      meta: response.meta,
    };
  },
  detail: async (importerId: number): Promise<MfdsImporterItem> => {
    const response = await apiClient.get<MfdsImporterItem>(
      MfdsImporterApi.detail.endpoint(importerId)
    );
    return response.data;
  },
  create: (data: MfdsImporterCreateRequest): Promise<MfdsImporterMutationResult> =>
    apiClient.post<MfdsImporterMutationResult, MfdsImporterCreateRequest>(
      MfdsImporterApi.create.endpoint,
      data
    ),
  update: (
    importerId: number,
    data: MfdsImporterUpdateRequest
  ): Promise<MfdsImporterMutationResult> =>
    apiClient.put<MfdsImporterMutationResult, MfdsImporterUpdateRequest>(
      MfdsImporterApi.update.endpoint(importerId),
      data
    ),
};
