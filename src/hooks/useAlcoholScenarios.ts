import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { alcoholScenarioService as service } from '@/services/alcohol-scenario.service';
import type { ScenarioDefinition, ScenarioPreviewRequest } from '@/types/api/alcohol-scenario.api';

export const alcoholScenarioKeys = {
  group: (groupId: number) => ['alcohol-scenarios', groupId] as const,
  list: (groupId: number) => [...alcoholScenarioKeys.group(groupId), 'list'] as const,
  detail: (groupId: number, scenarioId: number) =>
    [...alcoholScenarioKeys.group(groupId), scenarioId] as const,
  version: (groupId: number, scenarioId: number, versionId: number) =>
    [...alcoholScenarioKeys.detail(groupId, scenarioId), 'version', versionId] as const,
};
export function useAlcoholScenarios(groupId: number, enabled = true) {
  return useApiQuery(
    alcoholScenarioKeys.list(groupId),
    ({ signal }) => service.list(groupId, signal),
    { enabled: enabled && groupId > 0, retry: false }
  );
}
export function useAlcoholScenarioDetail(groupId: number, scenarioId: number, enabled = true) {
  return useApiQuery(
    alcoholScenarioKeys.detail(groupId, scenarioId),
    ({ signal }) => service.detail(groupId, scenarioId, signal),
    { enabled: enabled && scenarioId > 0, retry: false }
  );
}
export function useAlcoholScenarioVersion(
  groupId: number,
  scenarioId: number,
  versionId: number,
  enabled = true
) {
  return useApiQuery(
    alcoholScenarioKeys.version(groupId, scenarioId, versionId),
    ({ signal }) => service.version(groupId, scenarioId, versionId, signal),
    { enabled: enabled && versionId > 0, retry: false }
  );
}
export function useAlcoholScenarioCreate(groupId: number) {
  return useApiMutation((data: { title: string; slot: number }) => service.create(groupId, data), {
    invalidateKeys: [alcoholScenarioKeys.list(groupId)],
    retry: false,
  });
}
export function useAlcoholScenarioSave(groupId: number, scenarioId: number, versionId: number) {
  const client = useQueryClient();
  return useApiMutation(
    (data: { expectedLockVersion: number; definition: ScenarioDefinition }) =>
      service.save(groupId, scenarioId, versionId, data),
    {
      retry: false,
      successMessage: '시나리오를 저장했습니다.',
      onSuccess: async (data) => {
        // 서버가 발급한 ID와 revision을 다음 저장과 미리보기에도 사용한다.
        client.setQueryData(alcoholScenarioKeys.version(groupId, scenarioId, versionId), data);
        await client.invalidateQueries({
          queryKey: alcoholScenarioKeys.detail(groupId, scenarioId),
          exact: true,
        });
      },
    }
  );
}
export function useAlcoholScenarioPreview(
  groupId: number,
  scenarioId: number,
  versionId: number,
  request: ScenarioPreviewRequest,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: [...alcoholScenarioKeys.version(groupId, scenarioId, versionId), 'preview', request],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      service.preview(
        groupId,
        scenarioId,
        versionId,
        { ...request, page: pageParam, size: 25 },
        signal
      ),
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
    enabled: enabled && versionId > 0,
    staleTime: request.viewQuestionId === undefined ? 0 : 30_000,
    retry: false,
  });
}
