/**
 * 식약처 수입 신고 API 타입
 */

import type { ApiMeta } from './common';

export const MfdsDeclarationApi = {
  list: {
    endpoint: '/admin/api/v1/mfds/declarations',
    method: 'GET',
  },
} as const;

export type MfdsNormalizationStatus =
  | 'PENDING'
  | 'STALE'
  | 'NORMALIZED'
  | 'PARTIAL'
  | 'REVIEW_REQUIRED'
  | 'UNPARSED';

export type MfdsImporterLinkSource = 'PAGE_NAME' | 'PAGE_RCNO' | 'MANUAL';

export interface MfdsDeclarationSearchParams {
  normalizationStatus?: MfdsNormalizationStatus;
  alcoholMatched?: boolean;
  alcoholMatchDecision?: string;
  importerId?: number;
  keyword?: string;
  cursor?: number;
  pageSize?: number;
}

export interface MfdsDeclarationListItem {
  id: number;
  rcno: string;
  baseProductNameKo: string | null;
  baseProductNameEn: string | null;
  volumeMl: number | null;
  abvPercent: number | null;
  normalizationStatus: MfdsNormalizationStatus;
  importerId: number | null;
  importerBaseName: string | null;
  importerLinkSource: MfdsImporterLinkSource | null;
  selectedAlcoholId: number | null;
  alcoholMatchDecision: string | null;
  matchedAt: string | null;
  createdAt: string;
}

export interface MfdsDeclarationListMeta extends ApiMeta {
  nextCursor: number | null;
  hasNext: boolean;
}
