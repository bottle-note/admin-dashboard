/**
 * 어드민 Alcohol API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  adminAlcoholService,
  adminAlcoholKeys,
  type AlcoholListResponse,
} from '@/services/admin-alcohol.service';
import type {
  AlcoholSearchParams,
  AlcoholDetail,
  AlcoholCreateRequest,
  AlcoholCreateResponse,
  AlcoholDeleteResponse,
  AlcoholUpdateRequest,
  AlcoholUpdateResponse,
  CategoryReference,
} from '@/types/api';

/**
 * 술 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdminAlcoholList({ category: 'SINGLE_MALT' });
 *
 * if (data) {
 *   console.log(data.items);  // 술 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useAdminAlcoholList(params?: AlcoholSearchParams) {
  return useApiQuery<AlcoholListResponse>(
    adminAlcoholKeys.list(params),
    () => adminAlcoholService.search(params),
    {
      // 캐시 유지 시간 설정
      staleTime: 1000 * 60, // 1분
    }
  );
}

/**
 * 술 상세 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdminAlcoholDetail(1);
 *
 * if (data) {
 *   console.log(data.korName);  // 한글 이름
 *   console.log(data.tastingTags);  // 테이스팅 태그 목록
 * }
 * ```
 */
export function useAdminAlcoholDetail(alcoholId: number | undefined) {
  return useApiQuery<AlcoholDetail>(
    adminAlcoholKeys.detail(alcoholId ?? 0),
    () => adminAlcoholService.getDetail(alcoholId!),
    {
      enabled: !!alcoholId && alcoholId > 0,
      staleTime: 1000 * 60, // 1분
    }
  );
}

/**
 * 술 생성 훅
 *
 * @example
 * ```tsx
 * const createMutation = useAdminAlcoholCreate({
 *   onSuccess: (data) => {
 *     console.log('생성된 ID:', data.targetId);
 *     navigate('/whisky');
 *   },
 * });
 *
 * createMutation.mutate({
 *   korName: '글렌피딕 12년',
 *   engName: 'Glenfiddich 12 Years',
 *   // ...
 * });
 * ```
 */
export function useAdminAlcoholCreate(
  options?: Omit<
    UseApiMutationOptions<AlcoholCreateResponse, AlcoholCreateRequest>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<AlcoholCreateResponse, AlcoholCreateRequest>(
    adminAlcoholService.create,
    {
      successMessage: '위스키가 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: adminAlcoholKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: AlcoholCreateResponse, variables: AlcoholCreateRequest, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 카테고리 레퍼런스 조회 훅
 * DB에 등록된 모든 카테고리 페어(한글/영문) 목록을 조회합니다.
 *
 * @example
 * ```tsx
 * const { data: categories, isLoading } = useCategoryReferences();
 *
 * if (categories) {
 *   categories.forEach(cat => {
 *     console.log(cat.korCategory, cat.engCategory);
 *   });
 * }
 * ```
 */
export function useCategoryReferences() {
  return useApiQuery<CategoryReference[]>(
    [...adminAlcoholKeys.all, 'category-references'],
    () => adminAlcoholService.getCategoryReferences(),
    {
      staleTime: 1000 * 60 * 5, // 5분 (카테고리는 자주 변경되지 않음)
    }
  );
}

/**
 * 술 삭제 훅
 * 소프트 삭제로 처리되며, 리뷰/평점이 있는 술은 삭제 불가
 *
 * @example
 * ```tsx
 * const deleteMutation = useAdminAlcoholDelete({
 *   onSuccess: () => {
 *     navigate('/whisky');
 *   },
 * });
 *
 * deleteMutation.mutate(alcoholId);
 * ```
 */
export function useAdminAlcoholDelete(
  options?: Omit<UseApiMutationOptions<AlcoholDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<AlcoholDeleteResponse, number>(
    adminAlcoholService.delete,
    {
      successMessage: '위스키가 삭제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: adminAlcoholKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: adminAlcoholKeys.detail(variables) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: AlcoholDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 술 수정 mutation 변수 타입
 */
export interface AlcoholUpdateVariables {
  alcoholId: number;
  data: AlcoholUpdateRequest;
}

/**
 * 술 수정 훅
 * 전체 수정(PUT)이므로 모든 필드를 전달해야 함
 * 이미 삭제된 술은 수정 불가
 *
 * @example
 * ```tsx
 * const updateMutation = useAdminAlcoholUpdate({
 *   onSuccess: () => {
 *     console.log('수정 완료');
 *   },
 * });
 *
 * updateMutation.mutate({
 *   alcoholId: 1,
 *   data: {
 *     korName: '수정된 위스키',
 *     engName: 'Updated Whisky',
 *     // ...
 *   },
 * });
 * ```
 */
export function useAdminAlcoholUpdate(
  options?: Omit<UseApiMutationOptions<AlcoholUpdateResponse, AlcoholUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<AlcoholUpdateResponse, AlcoholUpdateVariables>(
    ({ alcoholId, data }) => adminAlcoholService.update(alcoholId, data),
    {
      successMessage: '위스키가 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: adminAlcoholKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: adminAlcoholKeys.detail(variables.alcoholId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: AlcoholUpdateResponse, variables: AlcoholUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}
