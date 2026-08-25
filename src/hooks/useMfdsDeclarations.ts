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
