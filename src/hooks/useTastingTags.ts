/**
 * 테이스팅 태그 API 커스텀 훅
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, type UseApiMutationOptions } from './useApiMutation';
import { useToast } from './useToast';
import { getErrorMessage, type ApiError } from '@/lib/api-error';
import {
  tastingTagService,
  tastingTagKeys,
  type TastingTagListResponse,
} from '@/services/tasting-tag.service';
import type {
  TastingTagSearchParams,
  TastingTagFormData,
  TastingTagFormResponse,
  TastingTagDeleteResponse,
  TastingTagDetail,
  TastingTagAlcoholConnectionResponse,
} from '@/types/api';

/**
 * 테이스팅 태그 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTastingTagList({ keyword: '과일' });
 *
 * if (data) {
 *   console.log(data.items);  // 태그 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useTastingTagList(params?: TastingTagSearchParams) {
  return useApiQuery<TastingTagListResponse>(
    tastingTagKeys.list(params),
    () => tastingTagService.list(params),
    {
      staleTime: 1000 * 60 * 5, // 5분
    }
  );
}

/** 무한 스크롤용 page 인자 제외 파라미터 */
export type TastingTagInfiniteParams = Omit<TastingTagSearchParams, 'page'>;

const DEFAULT_INFINITE_PAGE_SIZE = 20;

/**
 * 테이스팅 태그 무한 스크롤 조회 훅
 *
 * 한 번에 모든 태그를 가져오지 않고 페이지 단위(기본 20개)로
 * 점진 로딩한다. 응답의 `meta.hasNext`로 다음 페이지 존재 여부 판단.
 *
 * keyword가 바뀌면 쿼리 키가 달라져 자동으로 첫 페이지부터 다시 로드.
 *
 * @example
 * ```tsx
 * const {
 *   data, fetchNextPage, hasNextPage, isFetchingNextPage,
 * } = useTastingTagListInfinite({ keyword: '바닐라' });
 *
 * const allItems = data?.pages.flatMap((p) => p.items) ?? [];
 * ```
 */
export function useTastingTagListInfinite(params?: TastingTagInfiniteParams) {
  const { showToast } = useToast();
  const size = params?.size ?? DEFAULT_INFINITE_PAGE_SIZE;

  return useInfiniteQuery<TastingTagListResponse, ApiError>({
    queryKey: tastingTagKeys.list({ ...params, size, infinite: true }),
    queryFn: async ({ pageParam }) => {
      try {
        return await tastingTagService.list({
          ...params,
          size,
          page: pageParam as number,
        });
      } catch (error) {
        showToast({ type: 'error', message: getErrorMessage(error) });
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

/** 무한 쿼리 페이지들을 평탄화 */
export function flattenTastingTagPages(
  data: { pages: TastingTagListResponse[] } | undefined
) {
  return data?.pages.flatMap((p) => p.items) ?? [];
}

/**
 * 테이스팅 태그 생성 훅
 *
 * @example
 * ```tsx
 * const createMutation = useTastingTagCreate({
 *   onSuccess: (data) => {
 *     console.log('생성된 ID:', data.targetId);
 *     navigate('/tasting-tags');
 *   },
 * });
 *
 * createMutation.mutate({
 *   korName: '과일향',
 *   engName: 'Fruity',
 *   description: '과일 향이 나는 태그',
 * });
 * ```
 */
export function useTastingTagCreate(
  options?: Omit<
    UseApiMutationOptions<TastingTagFormResponse, TastingTagFormData>,
    'successMessage'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<TastingTagFormResponse, TastingTagFormData>(
    tastingTagService.create,
    {
      successMessage: '테이스팅 태그가 등록되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: tastingTagKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: TastingTagFormResponse, variables: TastingTagFormData, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 테이스팅 태그 수정 mutation 변수 타입
 */
export interface TastingTagUpdateVariables {
  id: number;
  data: TastingTagFormData;
}

/**
 * 테이스팅 태그 수정 훅
 *
 * @example
 * ```tsx
 * const updateMutation = useTastingTagUpdate({
 *   onSuccess: () => {
 *     console.log('수정 완료');
 *   },
 * });
 *
 * updateMutation.mutate({
 *   id: 1,
 *   data: {
 *     korName: '수정된 태그',
 *     engName: 'Updated Tag',
 *   },
 * });
 * ```
 */
export function useTastingTagUpdate(
  options?: Omit<UseApiMutationOptions<TastingTagFormResponse, TastingTagUpdateVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<TastingTagFormResponse, TastingTagUpdateVariables>(
    ({ id, data }) => tastingTagService.update(id, data),
    {
      successMessage: '테이스팅 태그가 수정되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: tastingTagKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: TastingTagFormResponse, variables: TastingTagUpdateVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 테이스팅 태그 삭제 훅
 *
 * @example
 * ```tsx
 * const deleteMutation = useTastingTagDelete({
 *   onSuccess: () => {
 *     navigate('/tasting-tags');
 *   },
 * });
 *
 * deleteMutation.mutate(1);
 * ```
 */
export function useTastingTagDelete(
  options?: Omit<UseApiMutationOptions<TastingTagDeleteResponse, number>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<TastingTagDeleteResponse, number>(
    tastingTagService.delete,
    {
      successMessage: '테이스팅 태그가 삭제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        // 목록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: tastingTagKeys.lists() });
        // 원래 onSuccess 콜백 호출
        if (onSuccess) {
          (onSuccess as (data: TastingTagDeleteResponse, variables: number, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

/**
 * 테이스팅 태그 상세 조회 훅
 */
export function useTastingTagDetail(id: number | undefined) {
  return useApiQuery<TastingTagDetail>(
    tastingTagKeys.detail(id ?? 0),
    () => tastingTagService.detail(id!),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    }
  );
}

export interface TastingTagAlcoholConnectionVariables {
  tagId: number;
  alcoholIds: number[];
}

export function useTastingTagConnectAlcohols(
  options?: Omit<UseApiMutationOptions<TastingTagAlcoholConnectionResponse, TastingTagAlcoholConnectionVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<TastingTagAlcoholConnectionResponse, TastingTagAlcoholConnectionVariables>(
    ({ tagId, alcoholIds }) => tastingTagService.connectAlcohols(tagId, alcoholIds),
    {
      successMessage: '위스키가 연결되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: tastingTagKeys.details() });
        if (onSuccess) {
          (onSuccess as (data: TastingTagAlcoholConnectionResponse, variables: TastingTagAlcoholConnectionVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}

export function useTastingTagDisconnectAlcohols(
  options?: Omit<UseApiMutationOptions<TastingTagAlcoholConnectionResponse, TastingTagAlcoholConnectionVariables>, 'successMessage'>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useApiMutation<TastingTagAlcoholConnectionResponse, TastingTagAlcoholConnectionVariables>(
    ({ tagId, alcoholIds }) => tastingTagService.disconnectAlcohols(tagId, alcoholIds),
    {
      successMessage: '위스키 연결이 해제되었습니다.',
      ...restOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({ queryKey: tastingTagKeys.details() });
        if (onSuccess) {
          (onSuccess as (data: TastingTagAlcoholConnectionResponse, variables: TastingTagAlcoholConnectionVariables, context: unknown) => void)(data, variables, context);
        }
      },
    }
  );
}
