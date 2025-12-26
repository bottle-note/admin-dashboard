/**
 * API Mutation 훅
 * TanStack Query의 useMutation을 래핑하여 타입 안전성과 에러/성공 처리 제공
 */

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { useToast } from './useToast';

// ============================================
// Types
// ============================================

export type UseApiMutationOptions<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
> = Omit<
  UseMutationOptions<TData, ApiError, TVariables, TContext>,
  'mutationFn'
> & {
  /**
   * 에러 발생 시 자동으로 Toast 표시 여부
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * 성공 시 표시할 Toast 메시지
   * 설정하지 않으면 성공 Toast를 표시하지 않음
   */
  successMessage?: string;
};

// ============================================
// useApiMutation Hook
// ============================================

/**
 * API 변경 요청을 위한 Mutation 훅
 * 자동 에러/성공 Toast 표시 기능 포함
 *
 * @example
 * ```tsx
 * const createMutation = useApiMutation(
 *   alcoholService.create,
 *   {
 *     successMessage: '주류가 등록되었습니다.',
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: alcoholKeys.all });
 *     },
 *   }
 * );
 *
 * // 사용
 * createMutation.mutate({ korName: '글렌피딕', ... });
 * ```
 */
export function useApiMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseApiMutationOptions<TData, TVariables, TContext>
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const {
    showErrorToast = true,
    successMessage,
    onError,
    onSuccess,
    ...mutationOptions
  } = options ?? {};
  const { showToast } = useToast();

  return useMutation<TData, ApiError, TVariables, TContext>({
    mutationFn,
    ...mutationOptions,
    onError: (error, variables, context) => {
      // 에러 Toast 표시
      if (showErrorToast) {
        showToast({
          type: 'error',
          message: getErrorMessage(error),
        });
      }
      // 원래 onError 콜백 호출
      if (onError) {
        (onError as (error: ApiError, variables: TVariables, context: TContext | undefined) => void)(error, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // 성공 Toast 표시
      if (successMessage) {
        showToast({
          type: 'success',
          message: successMessage,
        });
      }
      // 원래 onSuccess 콜백 호출
      if (onSuccess) {
        (onSuccess as (data: TData, variables: TVariables, context: TContext | undefined) => void)(data, variables, context);
      }
    },
  });
}
