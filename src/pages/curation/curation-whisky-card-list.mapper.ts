import type { SelectedWhisky } from '@/components/common/WhiskySearchSelect';

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
