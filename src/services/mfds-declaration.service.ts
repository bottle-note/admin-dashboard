/**
 * 식약처 수입 신고 API 서비스
 */

import { createQueryKeys } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/api-client';
import {
  MfdsDeclarationApi,
  type MfdsItemDetail,
  type MfdsDeclarationListItem,
  type MfdsDeclarationListMeta,
  type MfdsDeclarationSearchParams,
  type MfdsDeclarationDetail,
  type MfdsDeclarationImporterLinkRequest,
  type MfdsDeclarationImporterLinkResult,
  type MfdsMatchingCandidates,
  type MfdsBulkMatchingConfirmRequest,
  type MfdsBulkMatchingConfirmResponse,
  type MfdsBulkMatchingPreviewRequest,
  type MfdsBulkMatchingPreviewResponse,
  type MfdsMatchingConfirmRequest,
  type MfdsMatchingConfirmResponse,
  type MfdsMatchingRunResponse,
  type MfdsRcnoLinkItem,
} from '@/types/api';

const mfdsDeclarationBaseKeys = createQueryKeys('mfds-declarations');

export const mfdsDeclarationKeys = {
  ...mfdsDeclarationBaseKeys,
  sourceItem: (rcno: string) => [...mfdsDeclarationBaseKeys.all, 'source-item', rcno] as const,
  matchingCandidates: (declarationId: number) =>
    [...mfdsDeclarationBaseKeys.detail(declarationId), 'matching-candidates'] as const,
  rcnoLinks: (rcno: string) => [...mfdsDeclarationBaseKeys.all, 'rcno-links', rcno] as const,
  bulkMatchingPreview: (declarationId: number, alcoholId: number) =>
    [...mfdsDeclarationBaseKeys.detail(declarationId), 'bulk-preview', alcoholId] as const,
};

export interface MfdsDeclarationListResponse {
  items: MfdsDeclarationListItem[];
  meta: MfdsDeclarationListMeta;
}

export const mfdsDeclarationService = {
  sourceItem: async (rcno: string): Promise<MfdsItemDetail> => {
    const response = await apiClient.get<MfdsItemDetail>(
      MfdsDeclarationApi.sourceItem.endpoint(rcno)
    );
    return response.data;
  },
  list: async (params?: MfdsDeclarationSearchParams): Promise<MfdsDeclarationListResponse> => {
    const response = await apiClient.get<MfdsDeclarationListItem[], MfdsDeclarationListMeta>(
      MfdsDeclarationApi.list.endpoint,
      { params }
    );

    return {
      items: response.data ?? [],
      meta: response.meta,
    };
  },
  detail: async (declarationId: number): Promise<MfdsDeclarationDetail> => {
    const response = await apiClient.get<MfdsDeclarationDetail>(
      MfdsDeclarationApi.detail.endpoint(declarationId)
    );
    return response.data;
  },
  linkImporter: (
    declarationId: number,
    data: MfdsDeclarationImporterLinkRequest
  ): Promise<MfdsDeclarationImporterLinkResult> =>
    apiClient.post<MfdsDeclarationImporterLinkResult, MfdsDeclarationImporterLinkRequest>(
      MfdsDeclarationApi.importer.endpoint(declarationId),
      data
    ),
  unlinkImporter: (declarationId: number): Promise<MfdsDeclarationImporterLinkResult> =>
    apiClient.delete<MfdsDeclarationImporterLinkResult>(
      MfdsDeclarationApi.importerUnlink.endpoint(declarationId)
    ),
  matchingCandidates: async (declarationId: number): Promise<MfdsMatchingCandidates> => {
    const response = await apiClient.get<MfdsMatchingCandidates>(
      MfdsDeclarationApi.matchingCandidates.endpoint(declarationId)
    );
    return response.data;
  },
  runMatching: (declarationId: number): Promise<MfdsMatchingRunResponse> =>
    apiClient.post<MfdsMatchingRunResponse>(MfdsDeclarationApi.matchingRun.endpoint(declarationId)),
  confirmMatching: (
    declarationId: number,
    data: MfdsMatchingConfirmRequest
  ): Promise<MfdsMatchingConfirmResponse> =>
    apiClient.post<MfdsMatchingConfirmResponse, MfdsMatchingConfirmRequest>(
      MfdsDeclarationApi.matchingConfirm.endpoint(declarationId),
      data
    ),
  releaseMatching: (declarationId: number): Promise<MfdsMatchingConfirmResponse> =>
    apiClient.post<MfdsMatchingConfirmResponse>(
      MfdsDeclarationApi.matchingRelease.endpoint(declarationId)
    ),
  previewBulkMatching: (
    declarationId: number,
    data: MfdsBulkMatchingPreviewRequest
  ): Promise<MfdsBulkMatchingPreviewResponse> =>
    apiClient.post<MfdsBulkMatchingPreviewResponse, MfdsBulkMatchingPreviewRequest>(
      MfdsDeclarationApi.bulkMatchingPreview.endpoint(declarationId),
      data
    ),
  confirmBulkMatching: (
    declarationId: number,
    data: MfdsBulkMatchingConfirmRequest
  ): Promise<MfdsBulkMatchingConfirmResponse> =>
    apiClient.post<MfdsBulkMatchingConfirmResponse, MfdsBulkMatchingConfirmRequest>(
      MfdsDeclarationApi.bulkMatchingConfirm.endpoint(declarationId),
      data
    ),
  rcnoLinks: async (rcno: string): Promise<MfdsRcnoLinkItem[]> => {
    const response = await apiClient.get<MfdsRcnoLinkItem[]>(
      MfdsDeclarationApi.rcnoLinks.endpoint,
      {
        params: { rcno },
      }
    );
    return response.data;
  },
};
