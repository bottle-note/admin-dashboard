import { loadAttributeRelations } from '@/services/alcohol-attribute.service';
import { adminAlcoholService } from '@/services/admin-alcohol.service';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import {
  alcoholAttributeKeys as keys,
  alcoholAttributeService as service,
} from '@/services/alcohol-attribute.service';
import type {
  AttributeSearchParams,
  MappingSearchParams,
  AttributedAlcoholSearchParams,
  AttributeUpdateRequest,
} from '@/types/api/alcohol-attribute.api';

export function useAlcoholAttributes(params: AttributeSearchParams, enabled = true) {
  return useApiQuery(keys.list(params), () => service.list(params), { enabled });
}
export function useAttributeMappings(params: MappingSearchParams, enabled = true) {
  return useApiQuery(keys.mappings(params), () => service.mappings(params), { enabled });
}
export function useAttributedAlcohols(params: AttributedAlcoholSearchParams, enabled = true) {
  return useApiQuery(keys.alcohols(params), () => service.alcohols(params), { enabled });
}
export function useAttributeSummary(alcoholIds: number[]) {
  return useApiQuery(keys.summary(alcoholIds), () => service.summary(alcoholIds), {
    enabled: alcoholIds.length > 0,
  });
}
export function useAttributeEnums() {
  return useApiQuery(keys.enums, service.enums, { staleTime: Infinity });
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
export function useAlcoholAttributeDelete() {
  return useApiMutation(service.delete, mutationOptions);
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

export function useAttributeRelations() {
  return useApiQuery([...keys.all, 'relations'], loadAttributeRelations);
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
