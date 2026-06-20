import type {
  CurationWhiskyCardValue,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import type { TastingEventCreateFormState } from './tasting-event.schema';

export interface TastingEventPreviewWhisky {
  id: string;
  name: string;
  englishName?: string;
  imageUrl?: string;
  tags: string[];
  comment?: string;
  meta: string[];
  stats?: CurationWhiskyStats | null;
}

export interface TastingEventPreviewModel {
  title: string;
  description: string;
  imageUrl?: string;
  imageCount: number;
  scheduleLabel: string;
  locationLabel: string;
  entryFeeLabel: string;
  capacityLabel: string;
  recruitingLabel: string;
  applicationLink?: string;
  guideText?: string;
  whiskies: TastingEventPreviewWhisky[];
}

export function createTastingEventPreviewModel(
  values: TastingEventCreateFormState
): TastingEventPreviewModel {
  const imageUrls = getStringArray(values.imageUrls);
  const eventDate = formatDate(getString(values.eventDate));
  const eventTime = getString(values.eventTime);
  const placeName = getString(values.placeName);
  const barAddress = getString(values.barAddress);
  const detailAddress = getString(values.detailAddress);
  const entryFee = getNumber(values.entryFee);
  const capacity = getNumber(values.capacity);

  return {
    title: getString(values.name) || '큐레이션명',
    description: getString(values.description) || '설명 입력 시 앱 미리보기에 표시됩니다.',
    imageUrl: normalizeImageUrl(imageUrls[0]),
    imageCount: imageUrls.length,
    scheduleLabel: [eventDate, eventTime].filter(Boolean).join(' ') || '일정 미정',
    locationLabel: [placeName, barAddress, detailAddress].filter(Boolean).join(' ') || '장소 미정',
    entryFeeLabel: formatEntryFee(entryFee),
    capacityLabel: capacity === null ? '인원 미정' : `${capacity.toLocaleString('ko-KR')}명`,
    recruitingLabel: values.isRecruiting ? '참여자 모집 중' : '광고 노출',
    applicationLink: getString(values.applicationLink),
    guideText: getString(values.guideText),
    whiskies: getWhiskies(values.alcohols),
  };
}

function getWhiskies(values: CurationWhiskyCardValue[] | undefined): TastingEventPreviewWhisky[] {
  return (values ?? []).map((item, index) => {
    const alcohol = item.alcohol;
    const tags = alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean);

    return {
      id: `${item.source}-${alcohol.alcoholId ?? index}`,
      name: alcohol.korName.trim() || '위스키명 미입력',
      englishName: getString(alcohol.engName),
      imageUrl: normalizeImageUrl(alcohol.imageUrl),
      tags,
      comment: getString(item.comment),
      meta: [
        formatAbv(alcohol.abv),
        getString(alcohol.volume),
        getString(alcohol.cask),
        getString(alcohol.regionName),
        getString(alcohol.korCategory),
      ].filter((value): value is string => Boolean(value)),
      stats: item.stats,
    };
  });
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

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  return `${match[1]}.${match[2]}.${match[3]}`;
}

function formatEntryFee(value: number | null): string {
  if (value === null) return '참가비 미정';
  if (value === 0) return '무료';

  return `${value.toLocaleString('ko-KR')}원`;
}

function formatAbv(value: string | undefined): string {
  const trimmedValue = getString(value);
  if (!trimmedValue) return '';

  return trimmedValue.includes('%') ? trimmedValue : `${trimmedValue}%`;
}
