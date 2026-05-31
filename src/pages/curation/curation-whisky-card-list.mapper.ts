import type { SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import type { AlcoholDetail } from '@/types/api';

import type { CurationWhiskyCardValue } from './curation-whisky-card-list.types';

export function createBottleNoteCurationWhiskyItem(
  whisky: SelectedWhisky
): CurationWhiskyCardValue {
  return {
    source: 'BOTTLE_NOTE',
    alcohol: {
      alcoholId: whisky.alcoholId,
      korName: whisky.korName,
      engName: whisky.engName,
      imageUrl: whisky.imageUrl,
      selectedTags: [],
    },
    comment: '',
  };
}

export function createBottleNoteCurationWhiskyItemFromDetail(
  detail: AlcoholDetail
): CurationWhiskyCardValue {
  return {
    source: 'BOTTLE_NOTE',
    alcohol: {
      alcoholId: detail.alcoholId,
      korName: detail.korName,
      engName: detail.engName,
      imageUrl: detail.imageUrl,
      abv: detail.abv ?? '',
      cask: detail.cask ?? '',
      volume: detail.volume ?? '',
      regionName: detail.korRegion ?? detail.engRegion ?? '',
      korCategory: detail.korCategory,
      selectedTags: Array.from(
        new Set(detail.tastingTags.map((tag) => tag.korName).filter(Boolean))
      ),
    },
    stats: {
      rating: detail.avgRating,
      totalRatingsCount: detail.totalRatingsCount,
      reviewCount: detail.reviewCount,
      totalPickCount: detail.pickCount,
    },
    comment: '',
  };
}

export function createManualCurationWhiskyItem(): CurationWhiskyCardValue {
  return {
    source: 'MANUAL',
    alcohol: {
      alcoholId: null,
      korName: '',
      engName: '',
      imageUrl: '',
      abv: '',
      cask: '',
      volume: '',
      regionName: '',
      korCategory: '',
      selectedTags: [],
    },
    comment: '',
  };
}
