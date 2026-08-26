import type { ApiMeta } from './common';

export const MfdsImporterApi = {
  list: {
    endpoint: '/admin/api/v1/mfds/importers',
    method: 'GET',
  },
  detail: {
    endpoint: (importerId: number) => `/admin/api/v1/mfds/importers/${importerId}`,
    method: 'GET',
  },
} as const;

export type MfdsImporterAdminStatus = 'ACTIVE' | 'INACTIVE';

export interface MfdsImporterSearchParams {
  adminStatus?: MfdsImporterAdminStatus;
  keyword?: string;
  cursor?: number;
  pageSize?: number;
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

export interface MfdsImporterListMeta extends ApiMeta {
  nextCursor: number | null;
  hasNext: boolean;
}
