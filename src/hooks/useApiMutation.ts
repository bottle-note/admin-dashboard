/**
 * API Mutation 훅
 * TanStack Query의 useMutation을 래핑하여 타입 안전성과 에러/성공 처리 제공
 */

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import { useToast } from './useToast';

// ============================================
// Types
// ============================================

export type UseApiMutationOptions<TData = unknown, TVariables = void, TContext = unknown> = Omit<
  UseMutationOptions<TData, ApiError, TVariables, TContext>,
  'mutationFn'
> & {
  /**
   * 에러 발생 시 자동으로 Toast 표시 여부
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * 성공 시 표시할 Toast 메시지. 응답에 따라 문구가 달라지면 함수로 준다
   * 설정하지 않으면 성공 Toast를 표시하지 않음
   */
  successMessage?: string | ((data: TData) => string);
  /**
   * 성공 시 무효화할 쿼리 키. 보통 도메인 namespace(`xxxKeys.all`) 하나를 준다
   */
  invalidateKeys?: QueryKey[];
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
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseApiMutationOptions<TData, TVariables, TContext>
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const {
    showErrorToast = true,
    successMessage,
    invalidateKeys,
    onError,
    onSuccess,
    ...mutationOptions
  } = options ?? {};
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables, TContext>({
    mutationFn,
    ...mutationOptions,
    onError: async (error, variables, context, mutationContext) => {
      // 에러 Toast 표시
      if (showErrorToast) {
        showToast({
          type: 'error',
          message: getErrorMessage(error),
        });
      }
      // 원래 onError 콜백 호출
      await onError?.(error, variables, context, mutationContext);
    },
    onSuccess: async (data, variables, context, mutationContext) => {
      await Promise.all(
        (invalidateKeys ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );
      // 성공 Toast 표시
      if (successMessage) {
        showToast({
          type: 'success',
          message: typeof successMessage === 'function' ? successMessage(data) : successMessage,
        });
      }
      // 원래 onSuccess 콜백 호출
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}
