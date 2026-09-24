/**
 * 식약처 수입 신고 API 타입
 */

import type { ApiMeta } from './common';
import type { MfdsImporterItem } from './mfds-importer.api';

export const MfdsDeclarationApi = {
  sourceItem: {
    endpoint: (rcno: string) => `/admin/api/v1/mfds/items/${encodeURIComponent(rcno)}`,
    method: 'GET',
  },
  list: {
    endpoint: '/admin/api/v1/mfds/declarations',
    method: 'GET',
  },
  detail: {
    endpoint: (declarationId: number) => `/admin/api/v1/mfds/declarations/${declarationId}`,
    method: 'GET',
  },
  importer: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/importer`,
    method: 'POST',
  },
  importerUnlink: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/importer`,
    method: 'DELETE',
  },
  matchingCandidates: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/candidates`,
    method: 'GET',
  },
  matchingRun: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/run`,
    method: 'POST',
  },
  matchingConfirm: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/confirm`,
    method: 'POST',
  },
  matchingRelease: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/release`,
    method: 'POST',
  },
  bulkMatchingPreview: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/bulk-preview`,
    method: 'POST',
  },
  bulkMatchingConfirm: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/bulk-confirm`,
    method: 'POST',
  },
  rcnoLinks: {
    endpoint: '/admin/api/v1/mfds/rcno-links',
    method: 'GET',
  },
} as const;

export type MfdsImporterLinkSource = 'PAGE_NAME' | 'PAGE_RCNO' | 'MANUAL';

export interface MfdsDeclarationSearchParams {
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
  processedDate: string | null;
  baseProductNameKo: string | null;
  baseProductNameEn: string | null;
  skuDisplayNameKo: string | null;
  skuDisplayNameEn: string | null;
  volumeMl: number | null;
  abvPercent: number | null;
  ageYears: number | null;
  alcoholCategoryKo: string | null;
  alcoholCategoryEn: string | null;
  importerId: number | null;
  importerBaseName: string | null;
  importerLinkSource: MfdsImporterLinkSource | null;
  selectedAlcoholId: number | null;
  alcoholMatchDecision: string | null;
  distilleryLinked: boolean;
  regionLinked: boolean;
  matchedAt: string | null;
  createdAt: string;
}

export interface MfdsDeclarationListMeta extends ApiMeta {
  nextCursor: number | null;
  hasNext: boolean;
}

export interface MfdsDeclarationImporterLinkRequest {
  importerId: number;
}

export interface MfdsDeclarationImporterLinkResult {
  code: string;
  message: string;
  targetId: number;
  responseAt: string;
}

export interface MfdsMatchCandidate {
  candidateId: number;
  score: number;
}

export interface MfdsDeclarationDetail {
  processedDate: string | null;
  id: number;
  rcno: string;
  baseProductNameKo: string | null;
  baseProductNameEn: string | null;
  skuDisplayNameKo: string | null;
  skuDisplayNameEn: string | null;
  volumeRaw: string | null;
  volumeMl: number | null;
  unitVolumeMl: number | null;
  packageCount: number | null;
  abvRaw: string | null;
  abvPercent: number | null;
  ageYears: number | null;
  vintageYear: number | null;
  editionName: string | null;
  caskNumber: string | null;
  batchNumber: string | null;
  expiryStart: string | null;
  expiryEnd: string | null;
  importerBaseName: string | null;
  manufacturerName: string | null;
  alcoholNameKo: string | null;
  alcoholNameEn: string | null;
  alcoholCategoryKo: string | null;
  alcoholCategoryEn: string | null;
  manufactureCountryNameKo: string | null;
  exportCountryNameKo: string | null;
  importerLinkSource: MfdsImporterLinkSource | null;
  importerLinkedAt: string | null;
  importer: MfdsImporterItem | null;
  selectedAlcoholId: number | null;
  alcoholMatchDecision: string | null;
  alcoholCandidates: MfdsMatchCandidate[];
  selectedDistilleryId: number | null;
  distilleryCandidates: MfdsMatchCandidate[];
  selectedRegionId: number | null;
  regionCandidates: MfdsMatchCandidate[];
  matchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MfdsMatchingSelection {
  alcoholId: number | null;
  alcoholMatchDecision: string | null;
  distilleryId: number | null;
  distilleryMatchSource: string | null;
  regionId: number | null;
  regionMatchSource: string | null;
}

export interface MfdsAlcoholCandidateItem {
  alcoholId: number;
  score: number;
  korName: string | null;
  engName: string | null;
  korCategory: string | null;
  engCategory: string | null;
  abv: string | null;
  age: string | null;
  imageUrl: string | null;
  scoreDetail: null;
}

export interface MfdsReferenceCandidateItem {
  id: number;
  score: number;
  korName: string | null;
  engName: string | null;
}

export interface MfdsMatchingCandidates {
  declarationId: number;
  matchingVersion: string | null;
  matchedAt: string | null;
  selection: MfdsMatchingSelection;
  alcoholCandidates: MfdsAlcoholCandidateItem[];
  distilleryCandidates: MfdsReferenceCandidateItem[];
  regionCandidates: MfdsReferenceCandidateItem[];
}

export interface MfdsMatchingRunResponse {
  declarationId: number;
  matchingVersion: string | null;
  matchedAt: string | null;
  alcoholCandidates: MfdsAlcoholCandidateItem[];
  distilleryCandidates: MfdsReferenceCandidateItem[];
  regionCandidates: MfdsReferenceCandidateItem[];
}

export interface MfdsMatchingConfirmRequest {
  alcoholId: number;
}

export interface MfdsMatchingConfirmResponse {
  declarationId: number;
  selectedAlcoholId: number | null;
  alcoholMatchDecision: string | null;
  selectedDistilleryId: number | null;
  distilleryMatchSource: string | null;
  selectedRegionId: number | null;
  regionMatchSource: string | null;
}

/** 같은 제품 그룹 미리보기. 분류와 사유는 안내용이며 확정을 막지 않는다. */
export interface MfdsBulkMatchingPreviewRequest {
  alcoholId: number;
  distilleryId?: number;
  regionId?: number;
}

export interface MfdsBulkMatchingReason {
  code: string;
  message: string;
}

export interface MfdsBulkMatchingPreviewItem {
  declarationId: number;
  rcno: string;
  displayName: string;
  volumeMl: number | null;
  importerBaseName: string | null;
  processedDate: string | null;
  classification: string;
  reasons: MfdsBulkMatchingReason[];
  currentAlcoholId: number | null;
  currentDistilleryId: number | null;
  currentRegionId: number | null;
}

export interface MfdsBulkMatchingPreviewResponse {
  alcoholNameKo: string | null;
  alcoholNameEn: string | null;
  distilleryId: number | null;
  regionId: number | null;
  items: MfdsBulkMatchingPreviewItem[];
}

/** 선택한 신고에 적용값을 그대로 반영한다. 같은 값이면 건너뛰고 다르면 덮어쓴다. */
export interface MfdsBulkMatchingConfirmRequest {
  alcoholId: number;
  distilleryId?: number;
  regionId?: number;
  declarationIds: number[];
}

export interface MfdsBulkMatchingConfirmResponse {
  applied: MfdsMatchingConfirmResponse[];
  unchangedDeclarationIds: number[];
}

export interface MfdsRcnoLinkItem {
  rcno: string;
  importerId: number;
  sourceImporterName: string;
  linkSource: MfdsImporterLinkSource;
  sourceGalleryUrl: string | null;
  sourceObservedAt: string | null;
  createdAt: string;
}

/** 동일 RCNO의 최신 수집 원장. */
export interface MfdsItemDetail {
  id: number;
  rcno: string;
  queriedItemCode: string;
  queriedItemName: string;
  productDivisionName: string | null;
  importerName: string | null;
  productNameKo: string | null;
  productNameEn: string | null;
  itemName: string | null;
  overseasEstablishmentName: string | null;
  processedDate: string | null;
  expiryText: string | null;
  manufactureCountryName: string | null;
  exportCountryName: string | null;
  detailHref: string | null;
  observedAt: string;
}
