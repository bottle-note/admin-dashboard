/**
 * 식약처 수입 신고 API 타입
 */

import type { ApiMeta } from './common';

export const MfdsDeclarationApi = {
  list: {
    endpoint: '/admin/api/v1/mfds/declarations',
    method: 'GET',
  },
  detail: {
    endpoint: (declarationId: number) => `/admin/api/v1/mfds/declarations/${declarationId}`,
    method: 'GET',
  },
  matchingCandidates: {
    endpoint: (declarationId: number) =>
      `/admin/api/v1/mfds/declarations/${declarationId}/matching/candidates`,
    method: 'GET',
  },
  rcnoLinks: {
    endpoint: '/admin/api/v1/mfds/rcno-links',
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

export type MfdsImporterAdminStatus = 'ACTIVE' | 'INACTIVE';

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

export interface MfdsMatchCandidate {
  candidateId: number;
  score: number;
}

export interface MfdsImporterItem {
  id: number;
  officialBusinessCode: string;
  licenseNo: string;
  businessName: string;
  representativeName: string | null;
  permitDate: string | null;
  institutionName: string | null;
  primaryAddress: string | null;
  telephoneNo: string | null;
  industryName: string | null;
  operatingStatus: string;
  description: string | null;
  adminNote: string | null;
  adminStatus: MfdsImporterAdminStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MfdsDeclarationDetail {
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
  normalizationStatus: MfdsNormalizationStatus;
  normalizationReasons: string[];
  unparsedFragments: string[];
  normalizedAt: string | null;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
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

export interface MfdsRcnoLinkItem {
  rcno: string;
  importerId: number;
  sourceImporterName: string;
  linkSource: MfdsImporterLinkSource;
  sourceGalleryUrl: string | null;
  sourceObservedAt: string | null;
  createdAt: string;
}
