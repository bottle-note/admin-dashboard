import { apiClient } from '@/lib/api-client';
import type {
  AlcoholAttribute,
  AttributeMapping,
  AttributedAlcohol,
  AttributePageMeta,
  AttributeSearchParams,
  MappingSearchParams,
  AttributedAlcoholSearchParams,
  AttributeCreateRequest,
  AttributeUpdateRequest,
  AttributeMappingRequest,
  AttributeMappingResult,
  AttributeResult,
  AttributeSummary,
  AttributeEnums,
} from '@/types/api/alcohol-attribute.api';

const base = '/admin/api/v1/alcohols/attributes';
const all = ['alcohol-attributes'] as const;
export const alcoholAttributeKeys = {
  all,
  list: (params: AttributeSearchParams) => [...all, 'list', params] as const,
  mappings: (params: MappingSearchParams) => [...all, 'mappings', params] as const,
  alcohols: (params: AttributedAlcoholSearchParams) => [...all, 'alcohols', params] as const,
  summary: (alcoholIds: number[]) => [...all, 'summary', alcoholIds] as const,
  enums: [...all, 'enums'] as const,
};

export const alcoholAttributeService = {
  async list(params: AttributeSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.get<AlcoholAttribute[], AttributePageMeta>(base, {
      params,
      signal,
      paramsSerializer: { indexes: null },
    });
    return { items: data, meta };
  },
  async mappings(params: MappingSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.get<AttributeMapping[], AttributePageMeta>(
      `${base}/mappings`,
      { params, signal }
    );
    return { items: data, meta };
  },
  async alcohols(params: AttributedAlcoholSearchParams, signal?: AbortSignal) {
    const { data, meta } = await apiClient.get<AttributedAlcohol[], AttributePageMeta>(
      `${base}/alcohols`,
      { params, signal }
    );
    return { items: data, meta };
  },
  async summary(alcoholIds: number[], signal?: AbortSignal) {
    const { data } = await apiClient.get<AttributeSummary[]>(`${base}/summary`, {
      params: { alcoholIds },
      signal,
      paramsSerializer: { indexes: null },
    });
    return data;
  },
  async enums() {
    return (await apiClient.get<AttributeEnums>(`${base}/enums`)).data;
  },
  create: (data: AttributeCreateRequest) => apiClient.post<AlcoholAttribute>(base, data),
  update: (id: number, data: AttributeUpdateRequest) =>
    apiClient.put<AttributeResult>(`${base}/${id}`, data),
  delete: (id: number) => apiClient.delete<AttributeResult>(`${base}/${id}`),
  deleteBatch: (ids: number[]) =>
    apiClient.post<AlcoholAttribute[]>(`${base}/batch/delete`, { ids }),
  link: (items: AttributeMappingRequest[]) =>
    apiClient.post<AttributeMappingResult>(`${base}/mappings/batch`, { items }),
  updateMapping: (id: number, value: string) =>
    apiClient.put<AttributeMapping>(`${base}/mappings/${id}`, { value }),
  unlink: (id: number) => apiClient.delete<AttributeResult>(`${base}/mappings/${id}`),
};
