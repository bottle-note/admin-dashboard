/**
 * 식약처 수입 신고 API 훅
 */

import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { useQueryClient } from '@tanstack/react-query';
import {
  mfdsDeclarationKeys,
  mfdsDeclarationService,
  type MfdsDeclarationListResponse,
} from '@/services/mfds-declaration.service';
import type { MfdsDeclarationSearchParams, MfdsMatchingConfirmRequest } from '@/types/api';

export function useMfdsDeclarationList(params?: MfdsDeclarationSearchParams) {
  return useApiQuery<MfdsDeclarationListResponse>(
    mfdsDeclarationKeys.list(params ? { ...params } : undefined),
    () => mfdsDeclarationService.list(params)
  );
}

export function useMfdsDeclarationDetail(declarationId: number | undefined) {
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;

  return useApiQuery(
    mfdsDeclarationKeys.detail(validDeclarationId),
    () => mfdsDeclarationService.detail(validDeclarationId),
    { enabled: validDeclarationId > 0 }
  );
}

export function useMfdsMatchingCandidates(declarationId: number | undefined) {
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;

  return useApiQuery(
    mfdsDeclarationKeys.matchingCandidates(validDeclarationId),
    () => mfdsDeclarationService.matchingCandidates(validDeclarationId),
    { enabled: validDeclarationId > 0 }
  );
}

export function useMfdsRcnoLinks(rcno: string | undefined) {
  const validRcno = rcno ?? '';

  return useApiQuery(
    mfdsDeclarationKeys.rcnoLinks(validRcno),
    () => mfdsDeclarationService.rcnoLinks(validRcno),
    { enabled: validRcno.length > 0 }
  );
}

export function useMfdsMatchingActions(declarationId: number | undefined) {
  const queryClient = useQueryClient();
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;

  const invalidateDeclaration = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.detail(validDeclarationId) }),
      queryClient.invalidateQueries({
        queryKey: mfdsDeclarationKeys.matchingCandidates(validDeclarationId),
      }),
    ]);

  const runMatching = useApiMutation(
    () => mfdsDeclarationService.runMatching(validDeclarationId),
    {
      successMessage: '매칭 후보를 다시 계산했습니다.',
      onSuccess: invalidateDeclaration,
    }
  );

  const confirmMatching = useApiMutation(
    (data: MfdsMatchingConfirmRequest) =>
      mfdsDeclarationService.confirmMatching(validDeclarationId, data),
    {
      successMessage: '보틀노트 위스키 연결을 확정했습니다.',
      onSuccess: invalidateDeclaration,
    }
  );

  const releaseMatching = useApiMutation(
    () => mfdsDeclarationService.releaseMatching(validDeclarationId),
    {
      successMessage: '연결을 해제했습니다.',
      onSuccess: invalidateDeclaration,
    }
  );

  return { runMatching, confirmMatching, releaseMatching };
}
