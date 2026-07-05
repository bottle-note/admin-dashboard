import type {
  CurationWhiskyCardValue,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import type { TastingEventPreviewData } from '../_preview';
import type { WhiskyTastingEventFormState } from './whisky-tasting-event.schema';

export function createWhiskyTastingEventPreviewModel(
  values: WhiskyTastingEventFormState
): TastingEventPreviewData {
  const imageUrls = getStringArray(values.imageUrls);
  const coverImageUrl = normalizeImageUrl(imageUrls[0]);

  return {
    name: getString(values.name) || '큐레이션명',
    description: getString(values.description) || '설명 입력 시 앱 미리보기에 표시됩니다.',
    coverImageUrl,
    imageUrls: imageUrls.map(normalizeImageUrl).filter(Boolean),
    payload: {
      capacity: getNumber(values.capacity) ?? 0,
      entryFee: getNumber(values.entryFee) ?? 0,
      eventDate: getString(values.eventDate),
      eventTime: getString(values.eventTime),
      guideText: getString(values.guideText),
      placeName: getString(values.placeName),
      barAddress: getString(values.barAddress),
      detailAddress: getString(values.detailAddress),
      isRecruiting: Boolean(values.isRecruiting),
      applicationLink: getString(values.applicationLink),
      alcohols: getAlcohols(values.alcohols),
    },
  };
}

function getAlcohols(values: CurationWhiskyCardValue[] | undefined) {
  return (values ?? []).map((item, index) => {
    const alcohol = item.alcohol;
    const tags = alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean);

    return {
      source: `${item.source}-${alcohol.alcoholId ?? index}`,
      stats: mapWhiskyStats(item.stats),
      comment: getString(item.comment),
      alcohol: {
        alcoholId: alcohol.alcoholId,
        korName: alcohol.korName.trim() || '위스키명 미입력',
        engName: getString(alcohol.engName),
        imageUrl: normalizeImageUrl(alcohol.imageUrl),
        regionName: getString(alcohol.regionName),
        korCategory: getString(alcohol.korCategory),
        selectedTags: tags,
        abv: getString(alcohol.abv),
      },
    };
  });
}

function mapWhiskyStats(stats: CurationWhiskyStats | null | undefined) {
  if (!stats) return null;

  return {
    rating: stats.rating ?? null,
    totalRatingsCount: stats.totalRatingsCount ?? undefined,
  };
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeImageUrl(value: unknown): string {
  const normalizedValue = getString(value);
  if (!normalizedValue) return '';

  if (/^(https?:|blob:|data:image\/)/i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('//')) {
    return `https:${normalizedValue}`;
  }

  return `https://${normalizedValue}`;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
