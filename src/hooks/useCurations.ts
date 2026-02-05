/**
 * 큐레이션 API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import {
  curationService,
  curationKeys,
  type CurationListResponse,
} from '@/services/curation.service';
import type {
  CurationSearchParams,
  CurationDetail,
  CurationCreateRequest,
  CurationCreateResponse,
  CurationUpdateRequest,
  CurationUpdateResponse,
  CurationDeleteResponse,
  CurationToggleStatusRequest,
  CurationToggleStatusResponse,
  CurationUpdateDisplayOrderRequest,
  CurationUpdateDisplayOrderResponse,
  CurationAddAlcoholsRequest,
  CurationAddAlcoholsResponse,
  CurationRemoveAlcoholResponse,
} from '@/types/api';

/**
 * 큐레이션 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCurationList({ keyword: '신년' });
 *
 * if (data) {
 *   console.log(data.items);  // 큐레이션 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useCurationList(params?: CurationSearchParams) {
  return useApiQuery<CurationListResponse>(
    curationKeys.list(params),
    () => curationService.search(params),
    {
      staleTime: 1000 * 60 * 5, // 5분
    }
  );
}

/**
 * 큐레이션 상세 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCurationDetail(1);
 *
 * if (data) {
 *   console.log(data.name);         // 큐레이션명
 *   console.log(data.alcohols);     // 포함된 위스키 목록
 * }
 * ```
 */
export function useCurationDetail(curationId: number | undefined) {
  return useApiQuery<CurationDetail>(
    curationKeys.detail(curationId ?? 0),
    () => curationService.getDetail(curationId!),
    {
      enabled: !!curationId && curationId > 0,
      staleTime: 1000 * 60 * 5, // 5분
    }
  );
}

/**
 * 큐레이션 생성 훅
 *
 * @example
 * ```tsx
 * const createMutation = useCurationCreate({
 *   onSuccess: (data) => {
 *     console.log('생성된 ID:', data.targetId);
 *     navigate('/curations');
 *   },
 * });
 *
 * createMutation.mutate({
 *   name: '신년 특집',
 *   description: '새해를 맞이하는 특별한 위스키',
 *   // ...
 * });
 * ```
 */
export function useCurationCreate(
  options?: Omit<
    UseApiMutationOptions<CurationCreateResponse, CurationCreateRequest>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationCreateResponse, CurationCreateRequest>(
    curationService.create,
    {
      successMessage: '큐레이션이 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationCreateResponse, variables: CurationCreateRequest, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 수정 mutation 변수 타입
 */
export interface CurationUpdateVariables {
  curationId: number;
  data: CurationUpdateRequest;
}

/**
 * 큐레이션 수정 훅
 *
 * @example
 * ```tsx
 * const updateMutation = useCurationUpdate({
 *   onSuccess: () => {
 *     console.log('수정 완료');
 *   },
 * });
 *
 * updateMutation.mutate({
 *   curationId: 1,
 *   data: {
 *     name: '수정된 큐레이션',
 *     description: '새로운 설명',
 *     // ...
 *   },
 * });
 * ```
 */
export function useCurationUpdate(
  options?: Omit<UseApiMutationOptions<CurationUpdateResponse, CurationUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationUpdateResponse, CurationUpdateVariables>(
    ({ curationId, data }) => curationService.update(curationId, data),
    {
      successMessage: '큐레이션이 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables.curationId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationUpdateResponse, variables: CurationUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 삭제 훅
 *
 * @example
 * ```tsx
 * const deleteMutation = useCurationDelete({
 *   onSuccess: () => {
 *     navigate('/curations');
 *   },
 * });
 *
 * deleteMutation.mutate(curationId);
 * ```
 */
export function useCurationDelete(
  options?: Omit<UseApiMutationOptions<CurationDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationDeleteResponse, number>(
    curationService.delete,
    {
      successMessage: '큐레이션이 삭제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 활성화 상태 토글 mutation 변수 타입
 */
export interface CurationToggleStatusVariables {
  curationId: number;
  data: CurationToggleStatusRequest;
}

/**
 * 큐레이션 활성화 상태 토글 훅
 *
 * @example
 * ```tsx
 * const toggleMutation = useCurationToggleStatus({
 *   onSuccess: () => {
 *     console.log('상태 변경 완료');
 *   },
 * });
 *
 * toggleMutation.mutate({
 *   curationId: 1,
 *   data: { isActive: false },
 * });
 * ```
 */
export function useCurationToggleStatus(
  options?: Omit<UseApiMutationOptions<CurationToggleStatusResponse, CurationToggleStatusVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationToggleStatusResponse, CurationToggleStatusVariables>(
    ({ curationId, data }) => curationService.toggleStatus(curationId, data),
    {
      successMessage: '큐레이션 상태가 변경되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables.curationId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationToggleStatusResponse, variables: CurationToggleStatusVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 노출 순서 변경 mutation 변수 타입
 */
export interface CurationUpdateDisplayOrderVariables {
  curationId: number;
  data: CurationUpdateDisplayOrderRequest;
}

/**
 * 큐레이션 노출 순서 변경 훅
 *
 * @example
 * ```tsx
 * const updateOrderMutation = useCurationUpdateDisplayOrder({
 *   onSuccess: () => {
 *     console.log('순서 변경 완료');
 *   },
 * });
 *
 * updateOrderMutation.mutate({
 *   curationId: 1,
 *   data: { displayOrder: 5 },
 * });
 * ```
 */
export function useCurationUpdateDisplayOrder(
  options?: Omit<UseApiMutationOptions<CurationUpdateDisplayOrderResponse, CurationUpdateDisplayOrderVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationUpdateDisplayOrderResponse, CurationUpdateDisplayOrderVariables>(
    ({ curationId, data }) => curationService.updateDisplayOrder(curationId, data),
    {
      successMessage: '노출 순서가 변경되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationUpdateDisplayOrderResponse, variables: CurationUpdateDisplayOrderVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 위스키 추가 mutation 변수 타입
 */
export interface CurationAddAlcoholsVariables {
  curationId: number;
  data: CurationAddAlcoholsRequest;
}

/**
 * 큐레이션 위스키 추가 훅
 *
 * @example
 * ```tsx
 * const addMutation = useCurationAddAlcohols({
 *   onSuccess: () => {
 *     console.log('위스키 추가 완료');
 *   },
 * });
 *
 * addMutation.mutate({
 *   curationId: 1,
 *   data: { alcoholIds: [10, 20, 30] },
 * });
 * ```
 */
export function useCurationAddAlcohols(
  options?: Omit<UseApiMutationOptions<CurationAddAlcoholsResponse, CurationAddAlcoholsVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationAddAlcoholsResponse, CurationAddAlcoholsVariables>(
    ({ curationId, data }) => curationService.addAlcohols(curationId, data),
    {
      successMessage: '위스키가 추가되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 상세 캐시 무효화 (alcohols 배열 변경)
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables.curationId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationAddAlcoholsResponse, variables: CurationAddAlcoholsVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 큐레이션 위스키 제거 mutation 변수 타입
 */
export interface CurationRemoveAlcoholVariables {
  curationId: number;
  alcoholId: number;
}

/**
 * 큐레이션 위스키 제거 훅
 *
 * @example
 * ```tsx
 * const removeMutation = useCurationRemoveAlcohol({
 *   onSuccess: () => {
 *     console.log('위스키 제거 완료');
 *   },
 * });
 *
 * removeMutation.mutate({
 *   curationId: 1,
 *   alcoholId: 10,
 * });
 * ```
 */
export function useCurationRemoveAlcohol(
  options?: Omit<UseApiMutationOptions<CurationRemoveAlcoholResponse, CurationRemoveAlcoholVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<CurationRemoveAlcoholResponse, CurationRemoveAlcoholVariables>(
    ({ curationId, alcoholId }) => curationService.removeAlcohol(curationId, alcoholId),
    {
      successMessage: '위스키가 제거되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: curationKeys.lists() });
        // 상세 캐시 무효화 (alcohols 배열 변경)
        queryClient.invalidateQueries({ queryKey: curationKeys.detail(variables.curationId) });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: CurationRemoveAlcoholResponse, variables: CurationRemoveAlcoholVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

// Re-export curationService for convenience
export { curationService };
