import { apiClient } from '@/lib/api-client';
import type {
  AlcoholAttribute,
  AttributeGroup,
  AttributeGroupRequest,
  AlcoholCompoundSearchParams,
  AttributeMapping,
  AttributedAlcohol,
  AttributePageMeta,
  AttributeSearchParams,
  AttributedAlcoholSearchParams,
  AttributeCreateRequest,
  AttributeUpdateRequest,
  AttributeMappingRequest,
  AttributeMappingResult,
  AttributeResult,
  AttributeSummary,
} from '@/types/api/alcohol-attribute.api';

import type { AttributeFacets } from '@/types/api/alcohol-attribute.api';

const base = '/admin/api/v1/alcohols/attributes';
const groupBase = '/admin/api/v1/alcohols/attribute-groups';
const all = ['alcohol-attributes'] as const;
export const alcoholAttributeKeys = {
  all,
  groups: [...all, 'groups'] as const,
  definitions: [...all, 'definitions'] as const,
  list: (params: AttributeSearchParams) => [...all, 'list', params] as const,
  alcohols: (params: AttributedAlcoholSearchParams) => [...all, 'alcohols', params] as const,
  compound: (params: AlcoholCompoundSearchParams) => [...all, 'compound', params] as const,
  facets: (params: AlcoholCompoundSearchParams) => [...all, 'facets', params] as const,
  summary: (alcoholIds: number[]) => [...all, 'summary', alcoholIds] as const,
};

export const alcoholAttributeService = {
  async groups(signal?: AbortSignal) {
    const { data } = await apiClient.get<AttributeGroup[]>(groupBase, { signal });
    return data;
  },
  createGroup: (data: AttributeGroupRequest) => apiClient.post<AttributeGroup>(groupBase, data),
  updateGroup: ({ id, data }: { id: number; data: AttributeGroupRequest }) =>
    apiClient.put<AttributeGroup>(`${groupBase}/${id}`, data),
  deleteGroup: (id: number) => apiClient.delete<AttributeResult>(`${groupBase}/${id}`),
  async definitions(signal?: AbortSignal) {
    const items: AlcoholAttribute[] = [];
    let page = 0;
    while (true) {
      const result = await alcoholAttributeService.list({ page, size: 100 }, signal);
      items.push(...result.items);
      if (!result.meta.hasNext) return items;
      page += 1;
    }
  },
  async list(params: AttributeSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.get<AlcoholAttribute[], AttributePageMeta>(base, {
      params,
      signal,
      paramsSerializer: { indexes: null },
    });
    return { items: data, meta };
  },
  async alcohols(params: AttributedAlcoholSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.get<AttributedAlcohol[], AttributePageMeta>(
      `${base}/alcohols`,
      { params, signal, paramsSerializer: { indexes: null } }
    );
    return { items: data, meta };
  },
  async searchAlcohols(params: AlcoholCompoundSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.postWithMeta<
      AttributedAlcohol[],
      AlcoholCompoundSearchParams,
      AttributePageMeta
    >(`${base}/alcohols/search`, params, { signal });
    return { items: data, meta };
  },
  async facets(params: AlcoholCompoundSearchParams, signal?: AbortSignal) {
    const { data } = await apiClient.postWithMeta<AttributeFacets, AlcoholCompoundSearchParams>(
      `${base}/alcohols/facets`,
      params,
      { signal }
    );
    return data;
  },
  async summary(alcoholIds: number[], signal?: AbortSignal) {
    const { data } = await apiClient.get<AttributeSummary[]>(`${base}/summary`, {
      params: { alcoholIds },
      signal,
      paramsSerializer: { indexes: null },
    });
    return data;
  },
  create: (data: AttributeCreateRequest) => apiClient.post<AlcoholAttribute>(base, data),
  update: (id: number, data: AttributeUpdateRequest) =>
    apiClient.put<AttributeResult>(`${base}/${id}`, data),
  deleteBatch: (ids: number[]) =>
    apiClient.post<AlcoholAttribute[]>(`${base}/batch/delete`, { ids }),
  link: (items: AttributeMappingRequest[]) =>
    apiClient.post<AttributeMappingResult>(`${base}/mappings/batch`, { items }),
  updateMapping: (id: number, value: string) =>
    apiClient.put<AttributeMapping>(`${base}/mappings/${id}`, { value }),
  unlink: (id: number) => apiClient.delete<AttributeResult>(`${base}/mappings/${id}`),
};
