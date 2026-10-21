import { useInfiniteQuery } from '@tanstack/react-query';
import { adminAlcoholService } from '@/services/admin-alcohol.service';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import {
  alcoholAttributeKeys as keys,
  alcoholAttributeService as service,
} from '@/services/alcohol-attribute.service';
import type {
  AttributeSearchParams,
  ScenarioCandidateRequest,
  AlcoholCompoundSearchParams,
  AttributedAlcoholSearchParams,
  AttributeUpdateRequest,
} from '@/types/api/alcohol-attribute.api';

export function useAlcoholAttributes(params: AttributeSearchParams, enabled = true) {
  return useApiQuery(keys.list(params), ({ signal }) => service.list(params, signal), { enabled });
}
export function useAttributedAlcohols(params: AttributedAlcoholSearchParams, enabled = true) {
  return useApiQuery(keys.alcohols(params), ({ signal }) => service.alcohols(params, signal), {
    enabled,
  });
}
export function useAttributeSummary(alcoholIds: number[]) {
  return useApiQuery(
    keys.summary(alcoholIds),
    ({ signal }) => service.summary(alcoholIds, signal),
    {
      enabled: alcoholIds.length > 0 && alcoholIds.length <= 500,
    }
  );
}
// 속성과 연결 변경은 목록, 영향 집계, 그래프 조회를 함께 갱신한다.
const mutationOptions = { invalidateKeys: [keys.all] };
export function useAlcoholAttributeCreate() {
  return useApiMutation(service.create, mutationOptions);
}
export function useAlcoholAttributeUpdate() {
  return useApiMutation(
    ({ id, data }: { id: number; data: AttributeUpdateRequest }) => service.update(id, data),
    mutationOptions
  );
}
export function useAlcoholAttributeBatchDelete() {
  return useApiMutation(service.deleteBatch, mutationOptions);
}
export function useAttributeLink() {
  return useApiMutation(service.link, mutationOptions);
}
export function useAttributeUnlink() {
  return useApiMutation(service.unlink, mutationOptions);
}

export function useAttributeAlcoholLookup(keyword: string, page: number, enabled: boolean) {
  return useApiQuery(
    [...keys.all, 'lookup', keyword, page],
    () => adminAlcoholService.lookup({ keyword: keyword || undefined, page, size: 20 }),
    { enabled }
  );
}

export function useAttributeMappingUpdate() {
  return useApiMutation(
    ({ id, value }: { id: number; value: string }) => service.updateMapping(id, value),
    mutationOptions
  );
}

export function useCompoundAlcoholSearch(params: AlcoholCompoundSearchParams, enabled = true) {
  return useApiQuery(
    keys.compound(params),
    ({ signal }) => service.searchAlcohols(params, signal),
    { enabled }
  );
}

export function useAttributeGroups() {
  return useApiQuery(keys.groups, ({ signal }) => service.groups(signal));
}
export function useAttributeDefinitions() {
  return useApiQuery(keys.definitions, ({ signal }) => service.definitions(signal));
}
export function useAttributeGroupCreate() {
  return useApiMutation(service.createGroup, mutationOptions);
}
export function useAttributeGroupUpdate() {
  return useApiMutation(service.updateGroup, mutationOptions);
}
export function useAttributeGroupDelete() {
  return useApiMutation(service.deleteGroup, mutationOptions);
}

export function useAttributeFacets(params: AlcoholCompoundSearchParams, enabled = true) {
  return useApiQuery(keys.facets(params), ({ signal }) => service.facets(params, signal), {
    enabled,
    showErrorToast: false,
    retry: false,
  });
}

export function useAttributeGraph(
  params: Omit<AlcoholCompoundSearchParams, 'page' | 'size'>,
  enabled = true
) {
  return useApiQuery(keys.graph(params), ({ signal }) => service.graph(params, signal), {
    enabled,
    retry: false,
    showErrorToast: false,
  });
}

export function useScenarioCandidates(
  groupId: number,
  params: ScenarioCandidateRequest,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: keys.candidates(groupId, params),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      service.candidates(
        groupId,
        {
          ...params,
          page: pageParam,
          size: 25,
          nextQuestion: pageParam === 0 ? params.nextQuestion : undefined,
        },
        signal
      ),
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}
