/**
 * 식약처 수입 신고 API 훅
 */

import { useApiQuery } from './useApiQuery';
import {
  mfdsDeclarationKeys,
  mfdsDeclarationService,
  type MfdsDeclarationListResponse,
} from '@/services/mfds-declaration.service';
import type { MfdsDeclarationSearchParams } from '@/types/api';

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
