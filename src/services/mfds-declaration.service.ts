/**
 * 식약처 수입 신고 API 서비스
 */

import { createQueryKeys } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/api-client';
import {
  MfdsDeclarationApi,
  type MfdsDeclarationListItem,
  type MfdsDeclarationListMeta,
  type MfdsDeclarationSearchParams,
} from '@/types/api';

export const mfdsDeclarationKeys = createQueryKeys('mfds-declarations');

export interface MfdsDeclarationListResponse {
  items: MfdsDeclarationListItem[];
  meta: MfdsDeclarationListMeta;
}

export const mfdsDeclarationService = {
  list: async (params?: MfdsDeclarationSearchParams): Promise<MfdsDeclarationListResponse> => {
    const response = await apiClient.getWithMeta<
      MfdsDeclarationListItem[],
      MfdsDeclarationListMeta
    >(MfdsDeclarationApi.list.endpoint, { params });

    return {
      items: response.data ?? [],
      meta: response.meta,
    };
  },
};
