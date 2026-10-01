import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  campaignContentService,
  campaignContentKeys,
  campaignMetricsKey,
  type CampaignContentListResponse,
} from '@/services/campaign-content.service';
import type {
  CampaignContentDetail,
  CampaignContentSearchParams,
  CampaignContentCreateRequest,
  CampaignContentUpdateRequest,
  CampaignContentStatusRequest,
  CampaignContentMutationResponse,
  CampaignContentMetrics,
  CampaignContentMetricsRange,
} from '@/types/api';

type MutationOptions<V> = Omit<
  UseApiMutationOptions<CampaignContentMutationResponse, V>,
  'successMessage'
>;
export type CampaignContentChange = { id: number; data: CampaignContentUpdateRequest };
export type CampaignContentStatusChange = { id: number; data: CampaignContentStatusRequest };

function notifySuccess<V>(
  options: MutationOptions<V> | undefined,
  result: CampaignContentMutationResponse,
  vars: V,
  context: unknown
) {
  (
    options?.onSuccess as
      | ((data: CampaignContentMutationResponse, variables: V, context: unknown) => void)
      | undefined
  )?.(result, vars, context);
}

export function useCampaignContentList(params: CampaignContentSearchParams) {
  return useApiQuery<CampaignContentListResponse>(campaignContentKeys.list({ ...params }), () =>
    campaignContentService.search(params)
  );
}
export function useCampaignContentDetail(id: number | undefined) {
  return useApiQuery<CampaignContentDetail>(
    campaignContentKeys.detail(id ?? 0),
    () => campaignContentService.getDetail(id!),
    { enabled: Number.isInteger(id) && (id ?? 0) > 0 }
  );
}
export function useCampaignContentMetrics(
  id: number | undefined,
  range: CampaignContentMetricsRange
) {
  return useApiQuery<CampaignContentMetrics>(
    campaignMetricsKey(id ?? 0, range),
    () => campaignContentService.getMetrics(id!, range),
    { enabled: Number.isInteger(id) && (id ?? 0) > 0 }
  );
}
export function useCampaignContentCreate(options?: MutationOptions<CampaignContentCreateRequest>) {
  const client = useQueryClient();
  return useApiMutation(campaignContentService.create, {
    successMessage: '캠페인 콘텐츠가 등록되었습니다.',
    ...options,
    onSuccess: (result, vars, context) => {
      client.invalidateQueries({ queryKey: campaignContentKeys.lists() });
      notifySuccess(options, result, vars, context);
    },
  });
}
export function useCampaignContentUpdate(options?: MutationOptions<CampaignContentChange>) {
  const client = useQueryClient();
  return useApiMutation<CampaignContentMutationResponse, CampaignContentChange>(
    ({ id, data }) => campaignContentService.update(id, data),
    {
      successMessage: '캠페인 콘텐츠가 수정되었습니다.',
      ...options,
      onSuccess: (result, vars, context) => {
        client.invalidateQueries({ queryKey: campaignContentKeys.lists() });
        client.invalidateQueries({ queryKey: campaignContentKeys.detail(vars.id) });
        notifySuccess(options, result, vars, context);
      },
    }
  );
}
export function useCampaignContentStatus(options?: MutationOptions<CampaignContentStatusChange>) {
  const client = useQueryClient();
  return useApiMutation<CampaignContentMutationResponse, CampaignContentStatusChange>(
    ({ id, data }) => campaignContentService.updateStatus(id, data),
    {
      successMessage: '상태가 변경되었습니다.',
      ...options,
      onSuccess: (result, vars, context) => {
        client.invalidateQueries({ queryKey: campaignContentKeys.lists() });
        client.invalidateQueries({ queryKey: campaignContentKeys.detail(vars.id) });
        notifySuccess(options, result, vars, context);
      },
    }
  );
}
export function useCampaignContentDelete(options?: MutationOptions<number>) {
  const client = useQueryClient();
  return useApiMutation(campaignContentService.delete, {
    successMessage: '캠페인 콘텐츠가 삭제되었습니다.',
    ...options,
    onSuccess: (result, id, context) => {
      client.invalidateQueries({ queryKey: campaignContentKeys.lists() });
      client.removeQueries({ queryKey: campaignContentKeys.detail(id) });
      client.removeQueries({ queryKey: [...campaignContentKeys.all, 'metrics', id] });
      notifySuccess(options, result, id, context);
    },
  });
}
