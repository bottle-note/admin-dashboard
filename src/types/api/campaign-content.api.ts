export const CampaignContentApi = {
  search: '/admin/api/v1/campaign-contents',
  detail: (id: number) => `/admin/api/v1/campaign-contents/${id}`,
  create: '/admin/api/v1/campaign-contents',
  update: (id: number) => `/admin/api/v1/campaign-contents/${id}`,
  delete: (id: number) => `/admin/api/v1/campaign-contents/${id}`,
  status: (id: number) => `/admin/api/v1/campaign-contents/${id}/status`,
  metrics: (id: number) => `/admin/api/v1/campaign-contents/${id}/metrics`,
} as const;

export interface CampaignContentSearchParams {
  keyword?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}

export interface CampaignContentListItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  recentParticipants: number;
  isActive: boolean;
  createdAt: string;
}

export interface CampaignContentDetail extends Omit<CampaignContentListItem, 'recentParticipants'> {
  modifiedAt: string;
}

export interface CampaignContentPageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CampaignContentCreateRequest {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export type CampaignContentUpdateRequest = Omit<CampaignContentCreateRequest, 'code'>;
export interface CampaignContentStatusRequest {
  isActive: boolean;
}
export interface CampaignContentMutationResponse {
  code: string;
  message: string;
  targetId: number;
  responseAt: string;
}
export interface CampaignContentMetricsRange {
  from?: string;
  to?: string;
}
export interface CampaignContentMetrics {
  from: string;
  to: string;
  viewVisitors: number;
  startVisitors: number;
  finishVisitors: number;
  resultMembers: number;
  activeMembers: number;
  completionRate: number;
  loginConversionRate: number;
  participationRate: number;
}
