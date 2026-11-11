import type { ApiMeta } from './common';

export const AlcoholMergeApi = {
  preview: { endpoint: '/admin/api/v1/alcohols/merges/preview', method: 'POST' },
  merge: { endpoint: '/admin/api/v1/alcohols/merges', method: 'POST' },
  list: { endpoint: '/admin/api/v1/alcohols/merges', method: 'GET' },
} as const;

export interface AlcoholMergeRequest {
  baseAlcoholId: number;
  duplicateAlcoholIds: number[];
}

export interface AlcoholMergeWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
}

export interface AlcoholMergeCount {
  name: string;
  moved: number;
  deleted: number;
}

export interface AlcoholMergePreview {
  base: AlcoholMergeWhisky;
  duplicates: { alcohol: AlcoholMergeWhisky; counts: AlcoholMergeCount[] }[];
}

export interface AlcoholMergeResult {
  code: 'ALCOHOL_MERGED';
  message: string;
  targetId: number;
  responseAt: string;
}

export interface AlcoholMergeLog {
  mergeId: number;
  mergeGroupId: string;
  baseAlcoholId: number;
  baseKorName: string;
  duplicateAlcoholId: number;
  duplicateKorName: string;
  duplicateEngName: string;
  counts: AlcoholMergeCount[];
  mergedByAdminId: number | null;
  mergedByEmail: string | null;
  mergedAt: string;
}

export interface AlcoholMergeLogParams {
  baseAlcoholId?: number;
  duplicateAlcoholId?: number;
  page?: number;
  size?: number;
}

export interface AlcoholMergePageMeta extends ApiMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AlcoholMergeLogList {
  items: AlcoholMergeLog[];
  meta: AlcoholMergePageMeta;
}
