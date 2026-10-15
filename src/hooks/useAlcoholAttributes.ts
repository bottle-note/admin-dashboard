/**
 * 위스키 속성 API 커스텀 훅
 */

import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  alcoholAttributeKeys,
  alcoholAttributeService,
} from '@/services/alcohol-attribute.service';
import type {
  AlcoholAttributeCreateRequest,
  AlcoholAttributeCreateResponse,
  AlcoholAttributeEnums,
  AlcoholAttributeKeyStat,
  AlcoholAttributeKeywordCount,
  AlcoholAttributeResultResponse,
  AlcoholAttributeRow,
  AlcoholAttributeSummaryItem,
  AlcoholAttributeUpdateRequest,
  AttributedAlcoholListResponse,
  AttributedAlcoholSearchParams,
} from '@/types/api';

type MutationOptions<TData, TVariables> = Omit<
  UseApiMutationOptions<TData, TVariables>,
  'successMessage' | 'invalidateKeys'
>;

/** 속성 변경은 행·요약·집계·목록에 모두 영향을 주므로 namespace 전체를 무효화한다 */
const INVALIDATE = { invalidateKeys: [alcoholAttributeKeys.all] };

/** 선택한 위스키의 속성 행. 선택이 비면 호출하지 않는다 */
export function useAlcoholAttributeRows(alcoholIds: number[]) {
  return useApiQuery<AlcoholAttributeRow[]>(
    alcoholAttributeKeys.rows(alcoholIds),
    () => alcoholAttributeService.list(alcoholIds),
    { enabled: alcoholIds.length > 0, staleTime: 1000 * 60 }
  );
}

/** 선택한 위스키의 속성 묶음 요약 */
export function useAlcoholAttributeSummary(alcoholIds: number[]) {
  return useApiQuery<AlcoholAttributeSummaryItem[]>(
    alcoholAttributeKeys.summary(alcoholIds),
    () => alcoholAttributeService.summary(alcoholIds),
    { enabled: alcoholIds.length > 0, staleTime: 1000 * 60 }
  );
}

/** 속성이 붙은 위스키 목록. 조건이 바뀌는 동안 이전 페이지를 유지한다 */
export function useAttributedAlcohols(params: AttributedAlcoholSearchParams, enabled = true) {
  return useApiQuery<AttributedAlcoholListResponse>(
    alcoholAttributeKeys.alcohols(params),
    () => alcoholAttributeService.attributedAlcohols(params),
    { enabled, staleTime: 1000 * 60, placeholderData: (previous) => previous }
  );
}

/** 키워드 값과 사용 위스키 수 (전체 기준) */
export function useAlcoholAttributeKeywords() {
  return useApiQuery<AlcoholAttributeKeywordCount[]>(
    alcoholAttributeKeys.keywords(),
    () => alcoholAttributeService.keywords(),
    { staleTime: 1000 * 60 * 5 }
  );
}

/** 항목별 집계 (전체 기준) */
export function useAlcoholAttributeKeyStats() {
  return useApiQuery<AlcoholAttributeKeyStat[]>(
    alcoholAttributeKeys.keyStats(),
    () => alcoholAttributeService.keyStats(),
    { staleTime: 1000 * 60 * 5 }
  );
}

/** 분류·값 형식 라벨. 거의 바뀌지 않으므로 오래 캐시한다 */
export function useAlcoholAttributeEnums() {
  return useApiQuery<AlcoholAttributeEnums>(
    alcoholAttributeKeys.enums(),
    () => alcoholAttributeService.enums(),
    { staleTime: 1000 * 60 * 60 }
  );
}

export function useAlcoholAttributeCreate(
  options?: MutationOptions<AlcoholAttributeCreateResponse, AlcoholAttributeCreateRequest>
) {
  return useApiMutation(alcoholAttributeService.create, {
    ...options,
    ...INVALIDATE,
    successMessage: (data) =>
      data.skipped > 0
        ? `속성 ${data.added}개를 추가했습니다. 이미 있던 ${data.skipped}개는 건너뛰었습니다.`
        : `속성 ${data.added}개를 추가했습니다.`,
  });
}

export interface AlcoholAttributeUpdateVariables {
  id: number;
  data: AlcoholAttributeUpdateRequest;
}

export function useAlcoholAttributeUpdate(
  options?: MutationOptions<AlcoholAttributeResultResponse, AlcoholAttributeUpdateVariables>
) {
  return useApiMutation(
    ({ id, data }: AlcoholAttributeUpdateVariables) => alcoholAttributeService.update(id, data),
    { ...options, ...INVALIDATE, successMessage: '속성이 수정되었습니다.' }
  );
}

export function useAlcoholAttributeDelete(
  options?: MutationOptions<AlcoholAttributeResultResponse, number>
) {
  return useApiMutation(alcoholAttributeService.delete, {
    ...options,
    ...INVALIDATE,
    successMessage: '속성이 삭제되었습니다.',
  });
}

export function useAlcoholAttributeBatchDelete(
  options?: MutationOptions<AlcoholAttributeRow[], number[]>
) {
  return useApiMutation(alcoholAttributeService.batchDelete, {
    ...options,
    ...INVALIDATE,
    successMessage: (deleted) => `속성 ${deleted.length}개를 삭제했습니다.`,
  });
}
