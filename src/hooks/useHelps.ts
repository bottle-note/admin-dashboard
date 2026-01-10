/**
 * Help(문의) API 커스텀 훅
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import {
  helpService,
  helpKeys,
  type HelpListResponse,
} from '@/services/help.service';
import type {
  HelpListParams,
  HelpDetail,
  HelpAnswerRequest,
  HelpAnswerResponse,
} from '@/types/api';

/**
 * 문의 목록 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useHelpList({ status: 'WAITING' });
 *
 * if (data) {
 *   console.log(data.items);  // 문의 목록
 *   console.log(data.meta);   // 페이지네이션 정보
 * }
 * ```
 */
export function useHelpList(params?: HelpListParams) {
  return useApiQuery<HelpListResponse>(
    helpKeys.list(params),
    () => helpService.getList(params),
    {
      staleTime: 1000 * 30, // 30초
    }
  );
}

/**
 * 문의 상세 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useHelpDetail(123);
 * ```
 */
export function useHelpDetail(helpId: number | null) {
  return useApiQuery<HelpDetail>(
    helpKeys.detail(helpId ?? 0),
    () => helpService.getDetail(helpId!),
    {
      enabled: helpId !== null,
      staleTime: 1000 * 60, // 1분
    }
  );
}

/**
 * 문의 답변 등록 훅
 *
 * @example
 * ```tsx
 * const mutation = useHelpAnswer();
 *
 * mutation.mutate({
 *   helpId: 123,
 *   body: { responseContent: '답변 내용', status: 'SUCCESS' }
 * });
 * ```
 */
export function useHelpAnswer() {
  const queryClient = useQueryClient();

  return useApiMutation<
    HelpAnswerResponse,
    { helpId: number; body: HelpAnswerRequest }
  >(({ helpId, body }) => helpService.answer(helpId, body), {
    successMessage: '답변이 등록되었습니다.',
    onSuccess: (_, { helpId }) => {
      // 해당 문의 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: helpKeys.detail(helpId) });
      // 문의 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: helpKeys.lists() });
    },
  });
}
