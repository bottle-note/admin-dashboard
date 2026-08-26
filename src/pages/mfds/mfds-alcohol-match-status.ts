export const MFDS_ALCOHOL_MATCH_STATUS_MAP = {
  CONNECTED: {
    label: '연결됨',
    badgeClassName:
      'border-slate-950 bg-slate-950 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-950',
  },
  UNCONNECTED: {
    label: '연결 안 됨',
    badgeClassName:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
};

interface MfdsRelationCodeConfig {
  label: string;
  badgeClassName: string;
}

export const MFDS_MATCH_DECISION_MAP: Record<string, MfdsRelationCodeConfig> = {
  CANDIDATE: {
    label: '후보 선택',
    badgeClassName:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  MANUAL: {
    label: '직접 선택',
    badgeClassName:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  AUTO: {
    label: '자동 매칭',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  AUTO_SELECTED: {
    label: '자동 선정',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  REVIEW: {
    label: '검토 필요',
    badgeClassName:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  },
  AMBIGUOUS: {
    label: '후보 모호',
    badgeClassName:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  },
  CONFLICT_REVIEW: {
    label: '충돌 검토',
    badgeClassName:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
  NO_MATCH: {
    label: '후보 없음',
    badgeClassName:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
};

export const MFDS_UNKNOWN_RELATION_CODE = {
  badgeClassName:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};
