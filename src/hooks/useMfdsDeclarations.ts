/**
 * 식약처 수입 신고 API 훅
 */

import { useApiQuery } from './useApiQuery';
import { useApiMutation } from './useApiMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';
import {
  mfdsDeclarationKeys,
  mfdsDeclarationService,
  type MfdsDeclarationListResponse,
} from '@/services/mfds-declaration.service';
import type {
  MfdsBulkMatchingConfirmRequest,
  MfdsDeclarationImporterLinkRequest,
  MfdsDeclarationSearchParams,
  MfdsMatchingConfirmRequest,
} from '@/types/api';

export function useMfdsDeclarationList(params?: MfdsDeclarationSearchParams, enabled = true) {
  return useApiQuery<MfdsDeclarationListResponse>(
    mfdsDeclarationKeys.list(params ? { ...params } : undefined),
    () => mfdsDeclarationService.list(params),
    { enabled }
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

  const runMatching = useApiMutation(() => mfdsDeclarationService.runMatching(validDeclarationId), {
    successMessage: '매칭 후보를 다시 계산했습니다.',
    onSuccess: invalidateDeclaration,
  });

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

/**
 * 저장된 후보가 없는 신고에서 진입할 때 후보를 계산한다.
 * 계산은 서버에 저장하는 쓰기라 결과가 0건이어도 같은 세션에서는 다시 호출하지 않는다.
 * 상세 키를 무효화할 때 함께 재실행되지 않도록 별도 루트 키를 쓴다.
 */
export function useMfdsAutoMatching(declarationId: number, enabled: boolean) {
  const queryClient = useQueryClient();

  return useApiQuery(
    ['mfds-auto-matching', declarationId],
    async () => {
      const result = await mfdsDeclarationService.runMatching(declarationId);
      await queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.detail(declarationId) });
      return result;
    },
    {
      enabled: enabled && declarationId > 0,
      showErrorToast: false,
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );
}

/** 부작용 없는 조회라 POST지만 query로 캐시한다. 식별 키가 없는 신고는 400이므로 토스트를 띄우지 않는다. */
export function useMfdsBulkMatchingPreview(
  declarationId: number | undefined,
  alcoholId: number | undefined
) {
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;
  const validAlcoholId = alcoholId !== undefined && alcoholId > 0 ? alcoholId : 0;

  return useApiQuery(
    mfdsDeclarationKeys.bulkMatchingPreview(validDeclarationId, validAlcoholId),
    () =>
      mfdsDeclarationService.previewBulkMatching(validDeclarationId, {
        alcoholId: validAlcoholId,
      }),
    { enabled: validDeclarationId > 0 && validAlcoholId > 0, showErrorToast: false, retry: false }
  );
}

export function useMfdsBulkMatchingConfirm(declarationId: number | undefined) {
  const queryClient = useQueryClient();
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;

  const { showToast } = useToast();

  // 다른 신고도 함께 바뀌므로 신고 전체 캐시를 무효화한다.
  return useApiMutation(
    (data: MfdsBulkMatchingConfirmRequest) =>
      mfdsDeclarationService.confirmBulkMatching(validDeclarationId, data),
    {
      onSuccess: (result) => {
        const skipped = result.unchangedDeclarationIds.length;
        showToast({
          type: 'success',
          message:
            `${result.applied.length}건을 연결했습니다.` +
            (skipped ? ` 이미 같은 연결 ${skipped}건은 건너뛰었습니다.` : ''),
        });
        return queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.all });
      },
    }
  );
}

export function useMfdsImporterLinkActions(declarationId: number | undefined) {
  const queryClient = useQueryClient();
  const validDeclarationId = declarationId !== undefined && declarationId > 0 ? declarationId : 0;

  const invalidateDeclaration = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: mfdsDeclarationKeys.detail(validDeclarationId) }),
    ]);

  const linkImporter = useApiMutation(
    (data: MfdsDeclarationImporterLinkRequest) =>
      mfdsDeclarationService.linkImporter(validDeclarationId, data),
    {
      successMessage: '수입사를 연결했습니다.',
      onSuccess: invalidateDeclaration,
    }
  );

  const unlinkImporter = useApiMutation(
    () => mfdsDeclarationService.unlinkImporter(validDeclarationId),
    {
      successMessage: '수입사 연결을 해제했습니다.',
      onSuccess: invalidateDeclaration,
    }
  );

  return { linkImporter, unlinkImporter };
}

export function useMfdsSourceItem(rcno: string) {
  return useApiQuery(
    mfdsDeclarationKeys.sourceItem(rcno),
    () => mfdsDeclarationService.sourceItem(rcno),
    {
      enabled: Boolean(rcno),
      showErrorToast: false,
    }
  );
}
