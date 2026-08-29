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
  type MfdsDeclarationDetail,
  type MfdsDeclarationImporterLinkRequest,
  type MfdsDeclarationImporterLinkResult,
  type MfdsDeclarationStatusUpdateRequest,
  type MfdsDeclarationStatusUpdateResult,
  type MfdsMatchingCandidates,
  type MfdsMatchingConfirmRequest,
  type MfdsMatchingConfirmResponse,
  type MfdsMatchingRunResponse,
  type MfdsRcnoLinkItem,
} from '@/types/api';

const mfdsDeclarationBaseKeys = createQueryKeys('mfds-declarations');

export const mfdsDeclarationKeys = {
  ...mfdsDeclarationBaseKeys,
  matchingCandidates: (declarationId: number) =>
    [...mfdsDeclarationBaseKeys.detail(declarationId), 'matching-candidates'] as const,
  rcnoLinks: (rcno: string) => [...mfdsDeclarationBaseKeys.all, 'rcno-links', rcno] as const,
};

export interface MfdsDeclarationListResponse {
  items: MfdsDeclarationListItem[];
  meta: MfdsDeclarationListMeta;
}

export const mfdsDeclarationService = {
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
    apiClient.post<MfdsMatchingRunResponse>(
      MfdsDeclarationApi.matchingRun.endpoint(declarationId)
    ),
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
  updateNormalizationStatus: (
    declarationId: number,
    data: MfdsDeclarationStatusUpdateRequest
  ): Promise<MfdsDeclarationStatusUpdateResult> =>
    apiClient.patch<MfdsDeclarationStatusUpdateResult, MfdsDeclarationStatusUpdateRequest>(
      MfdsDeclarationApi.normalizationStatus.endpoint(declarationId),
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
