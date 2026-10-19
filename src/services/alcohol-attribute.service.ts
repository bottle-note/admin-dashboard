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
  async list(params: AttributeSearchParams) {
    const { data, meta } = await apiClient.get<AlcoholAttribute[], AttributePageMeta>(base, {
      params,
      paramsSerializer: { indexes: null },
    });
    return { items: data, meta };
  },
  async mappings(params: MappingSearchParams) {
    const { data, meta } = await apiClient.get<AttributeMapping[], AttributePageMeta>(
      `${base}/mappings`,
      { params }
    );
    return { items: data, meta };
  },
  async alcohols(params: AttributedAlcoholSearchParams) {
    const { data, meta } = await apiClient.get<AttributedAlcohol[], AttributePageMeta>(
      `${base}/alcohols`,
      { params }
    );
    return { items: data, meta };
  },
  async summary(alcoholIds: number[]) {
    const { data } = await apiClient.get<AttributeSummary[]>(`${base}/summary`, {
      params: { alcoholIds },
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

// 집계와 그래프에서 첫 페이지만 전체로 오인하지 않도록 마지막 페이지까지 읽는다.
export async function loadAttributeRelations() {
  async function collect<T>(
    read: (params: {
      page: number;
      size: number;
    }) => Promise<{ items: T[]; meta: { hasNext: boolean } }>
  ) {
    const items: T[] = [];
    for (let page = 0; ; page++) {
      const result = await read({ page, size: 100 });
      items.push(...result.items);
      if (!result.meta.hasNext) return items;
      if (!result.items.length)
        throw new Error('페이지 응답이 일치하지 않습니다. 다시 조회해 주세요.');
    }
  }
  const [attributes, mappings, alcohols] = await Promise.all([
    collect(alcoholAttributeService.list),
    collect(alcoholAttributeService.mappings),
    collect(alcoholAttributeService.alcohols),
  ]);
  return { attributes, mappings, alcohols };
}
