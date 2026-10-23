import { apiClient } from '@/lib/api-client';
import type {
  AlcoholScenario,
  ScenarioDetail,
  ScenarioVersionDetail,
  ScenarioDefinition,
  ScenarioPreview,
  ScenarioPreviewRequest,
} from '@/types/api/alcohol-scenario.api';
import type { AttributePageMeta } from '@/types/api/alcohol-attribute.api';

const base = (groupId: number) => `/admin/api/v1/attribute/groups/${groupId}/scenarios`;
const versionPath = (groupId: number, scenarioId: number, versionId: number) =>
  `${base(groupId)}/${scenarioId}/versions/${versionId}`;

export const alcoholScenarioService = {
  async list(groupId: number, signal?: AbortSignal) {
    return (await apiClient.get<AlcoholScenario[]>(base(groupId), { signal })).data;
  },
  create(groupId: number, data: { title: string; slot: number }) {
    return apiClient.post<ScenarioDetail>(base(groupId), data);
  },
  async detail(groupId: number, scenarioId: number, signal?: AbortSignal) {
    return (await apiClient.get<ScenarioDetail>(`${base(groupId)}/${scenarioId}`, { signal })).data;
  },
  async version(groupId: number, scenarioId: number, versionId: number, signal?: AbortSignal) {
    return (
      await apiClient.get<ScenarioVersionDetail>(versionPath(groupId, scenarioId, versionId), {
        signal,
      })
    ).data;
  },
  save(
    groupId: number,
    scenarioId: number,
    versionId: number,
    data: { expectedLockVersion: number; definition: ScenarioDefinition }
  ) {
    return apiClient.put<ScenarioVersionDetail>(versionPath(groupId, scenarioId, versionId), data);
  },
  preview(
    groupId: number,
    scenarioId: number,
    versionId: number,
    data: ScenarioPreviewRequest,
    signal?: AbortSignal
  ) {
    return apiClient.postWithMeta<ScenarioPreview, ScenarioPreviewRequest, AttributePageMeta>(
      `${versionPath(groupId, scenarioId, versionId)}/preview`,
      data,
      { signal }
    );
  },
};
