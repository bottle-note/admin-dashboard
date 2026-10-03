import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';
import {
  CampaignContentApi,
  type CampaignContentListItem,
  type CampaignContentPageMeta,
  type CampaignContentDetail,
  type CampaignContentSearchParams,
  type CampaignContentCreateRequest,
  type CampaignContentUpdateRequest,
  type CampaignContentMutationResponse,
  type CampaignContentStatusRequest,
  type CampaignContentMetrics,
  type CampaignContentMetricsRange,
} from '@/types/api';

export const campaignContentKeys = createQueryKeys('campaign-contents');
export const campaignMetricsKey = (id: number, range: CampaignContentMetricsRange) =>
  [
    ...campaignContentKeys.all,
    'metrics',
    id,
    range.from ?? 'default',
    range.to ?? 'default',
  ] as const;

export interface CampaignContentListResponse {
  items: CampaignContentListItem[];
  meta: CampaignContentPageMeta;
}

export const campaignContentService = {
  search: async (params: CampaignContentSearchParams): Promise<CampaignContentListResponse> => {
    const response = await apiClient.get<CampaignContentListItem[]>(CampaignContentApi.search, {
      params,
    });
    return {
      items: response.data ?? [],
      meta: {
        page: response.meta.page ?? params.page ?? 0,
        size: response.meta.size ?? params.size ?? 20,
        totalElements: response.meta.totalElements ?? 0,
        totalPages: response.meta.totalPages ?? 0,
        hasNext: response.meta.hasNext ?? false,
      },
    };
  },
  getDetail: async (id: number): Promise<CampaignContentDetail> =>
    (await apiClient.get<CampaignContentDetail>(CampaignContentApi.detail(id))).data,
  create: (body: CampaignContentCreateRequest) =>
    apiClient.post<CampaignContentMutationResponse, CampaignContentCreateRequest>(
      CampaignContentApi.create,
      body
    ),
  update: (id: number, body: CampaignContentUpdateRequest) =>
    apiClient.put<CampaignContentMutationResponse, CampaignContentUpdateRequest>(
      CampaignContentApi.update(id),
      body
    ),
  delete: (id: number) =>
    apiClient.delete<CampaignContentMutationResponse>(CampaignContentApi.delete(id)),
  updateStatus: (id: number, body: CampaignContentStatusRequest) =>
    apiClient.patch<CampaignContentMutationResponse, CampaignContentStatusRequest>(
      CampaignContentApi.status(id),
      body
    ),
  getMetrics: async (
    id: number,
    range: CampaignContentMetricsRange
  ): Promise<CampaignContentMetrics> =>
    (await apiClient.get<CampaignContentMetrics>(CampaignContentApi.metrics(id), { params: range }))
      .data,
};
