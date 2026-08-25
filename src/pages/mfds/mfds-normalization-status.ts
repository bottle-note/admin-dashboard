import type { MfdsNormalizationStatus } from '@/types/api';

interface MfdsNormalizationStatusConfig {
  value: MfdsNormalizationStatus;
  label: string;
  badgeClassName: string;
}

export const MFDS_NORMALIZATION_STATUS_MAP = {
  PENDING: {
    value: 'PENDING',
    label: '정규화 대기',
    badgeClassName:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
  STALE: {
    value: 'STALE',
    label: '재정규화 필요',
    badgeClassName:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  NORMALIZED: {
    value: 'NORMALIZED',
    label: '정규화 완료',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  PARTIAL: {
    value: 'PARTIAL',
    label: '부분 정규화',
    badgeClassName:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  REVIEW_REQUIRED: {
    value: 'REVIEW_REQUIRED',
    label: '검토 필요',
    badgeClassName:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  },
  UNPARSED: {
    value: 'UNPARSED',
    label: '정규화 실패',
    badgeClassName:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
} satisfies Record<MfdsNormalizationStatus, MfdsNormalizationStatusConfig>;

export const MFDS_NORMALIZATION_STATUS_OPTIONS = Object.values(MFDS_NORMALIZATION_STATUS_MAP);
