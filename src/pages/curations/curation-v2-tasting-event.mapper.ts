import type {
  CurationV2TastingEventFormValues,
  CurationV2TastingEventPayload,
} from './curation-v2-tasting-event.schema';

const ALCOHOL_OPTIONAL_TEXT_FIELDS = [
  'engName',
  'imageUrl',
  'abv',
  'cask',
  'volume',
  'regionName',
  'korCategory',
] as const;

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
      const alcohol = {
        alcoholId: item.source === 'MANUAL' ? null : item.alcohol.alcoholId,
        korName: item.alcohol.korName.trim(),
        selectedTags: item.alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean),
      } as typeof item.alcohol;

      ALCOHOL_OPTIONAL_TEXT_FIELDS.forEach((key) => {
        const value = item.alcohol[key]?.trim();
        if (value) {
          alcohol[key] = value;
        }
      });

      return {
        source: item.source,
        alcohol,
        ...(comment ? { comment } : {}),
      };
    }),
  };
}
