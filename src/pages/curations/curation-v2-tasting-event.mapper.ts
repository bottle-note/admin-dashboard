import type { SelectedWhisky } from '@/components/common/WhiskySearchSelect';

import type {
  CurationV2TastingEventFormValues,
  CurationV2TastingEventPayload,
} from './curation-v2-tasting-event.schema';

export function buildTastingEventPayload(
  values: CurationV2TastingEventFormValues
): CurationV2TastingEventPayload {
  return {
    eventDate: values.eventDate,
    eventTime: values.eventTime,
    barAddress: values.barAddress.trim(),
    detailAddress: values.detailAddress.trim(),
    isRecruiting: values.isRecruiting,
    entryFee: values.entryFee,
    capacity: values.capacity,
    applicationLink: values.applicationLink.trim(),
    guideText: values.guideText.trim(),
    alcohols: values.alcohols.map((item) => {
      const comment = item.comment?.trim();

      return {
        source: 'BOTTLE_NOTE',
        alcohol: {
          ...item.alcohol,
          selectedTags: item.alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean),
        },
        ...(comment ? { comment } : {}),
      };
    }),
  };
}

export function createTastingEventAlcoholItem(
  whisky: SelectedWhisky
): CurationV2TastingEventFormValues['alcohols'][number] {
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
