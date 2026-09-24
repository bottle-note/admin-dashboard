import type { MfdsAlcoholCandidateItem } from '@/types/api';

export type PendingWhiskySource = 'candidate' | 'search' | 'preview' | 'current';

export const PENDING_WHISKY_SOURCE_LABEL: Record<PendingWhiskySource, string> = {
  candidate: '후보',
  search: '직접 검색',
  preview: '추천',
  current: '현재 연결',
};

export interface PendingWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
  source: PendingWhiskySource;
}

export function toCandidateWhisky(
  candidate: MfdsAlcoholCandidateItem,
  source: PendingWhiskySource = 'candidate'
): PendingWhisky {
  return {
    alcoholId: candidate.alcoholId,
    korName: candidate.korName ?? candidate.engName ?? `ID ${candidate.alcoholId}`,
    engName: candidate.engName ?? '',
    imageUrl: candidate.imageUrl,
    source,
  };
}
