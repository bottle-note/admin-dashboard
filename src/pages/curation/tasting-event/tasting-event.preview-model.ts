import type {
  CurationWhiskyCardValue,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import type { TastingEventCreateFormState } from './tasting-event.schema';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export interface TastingEventPreviewAlcoholItem {
  id: string;
  stats?: CurationWhiskyStats | null;
  source: CurationWhiskyCardValue['source'];
  alcohol: {
    alcoholId?: number | null;
    korName: string;
    engName?: string;
    imageUrl?: string;
    regionName?: string;
    korCategory?: string;
    selectedTags: string[];
    abv?: string;
    volume?: string;
    cask?: string;
  };
  comment?: string;
}

export type TastingEventPreviewCta =
  | {
      type: 'apply';
      label: '시음회 신청하기';
      href: string;
    }
  | {
      type: 'closed';
      label: '모집 마감';
    }
  | {
      type: 'hidden';
    };

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
  coverImageUrl: string;
  imageUrls: string[];
  imageUrl?: string;
  imageCount: number;
  eventDateLabel: string;
  eventTimeLabel: string;
  eventDateTimeLabel: string;
  placeLabel: string;
  fullAddress: string;
  mapSearchUrl: string;
  scheduleLabel: string;
  locationLabel: string;
  entryFeeLabel: string;
  capacityLabel: string;
  recruitingLabel: string;
  applicationLink?: string;
  guideText?: string;
  alcohols: TastingEventPreviewAlcoholItem[];
  cta: TastingEventPreviewCta;
  whiskies: TastingEventPreviewWhisky[];
}

interface CreateTastingEventPreviewModelOptions {
  today?: Date;
}

export function createTastingEventPreviewModel(
  values: TastingEventCreateFormState,
  options: CreateTastingEventPreviewModelOptions = {}
): TastingEventPreviewModel {
  const imageUrls = getStringArray(values.imageUrls);
  const normalizedImageUrls = imageUrls.map(normalizeImageUrl).filter(Boolean);
  const coverImageUrl = normalizedImageUrls[0] ?? '';
  const galleryImageUrls = normalizedImageUrls.filter((imageUrl) => imageUrl !== coverImageUrl);
  const eventDateValue = getString(values.eventDate);
  const eventDate = formatDate(eventDateValue);
  const eventDateLabel = formatEventDateLabel(eventDateValue);
  const eventTime = getString(values.eventTime);
  const eventTimeLabel = formatEventTimeLabel(eventTime);
  const placeName = getString(values.placeName);
  const barAddress = getString(values.barAddress);
  const detailAddress = getString(values.detailAddress);
  const fullAddress = [barAddress, detailAddress].filter(Boolean).join(' ');
  const placeLabel = placeName || barAddress || '장소 미정';
  const entryFee = getNumber(values.entryFee);
  const capacity = getNumber(values.capacity);
  const applicationLink = getString(values.applicationLink);
  const today = options.today ?? new Date();
  const alcohols = getAlcohols(values.alcohols);

  return {
    title: getString(values.name) || '큐레이션명',
    description: getString(values.description) || '설명 입력 시 앱 미리보기에 표시됩니다.',
    coverImageUrl,
    imageUrls: galleryImageUrls,
    imageUrl: coverImageUrl,
    imageCount: normalizedImageUrls.length,
    eventDateLabel,
    eventTimeLabel,
    eventDateTimeLabel: [eventDateLabel, eventTimeLabel].filter(Boolean).join(' · ') || '일정 미정',
    placeLabel,
    fullAddress,
    mapSearchUrl: fullAddress
      ? `https://map.naver.com/p/search/${encodeURIComponent(fullAddress)}`
      : '',
    scheduleLabel: [eventDate, eventTime].filter(Boolean).join(' ') || '일정 미정',
    locationLabel: [placeName, barAddress, detailAddress].filter(Boolean).join(' ') || '장소 미정',
    entryFeeLabel: formatEntryFee(entryFee),
    capacityLabel: capacity === null ? '인원 미정' : `${capacity.toLocaleString('ko-KR')}명 정원`,
    recruitingLabel: values.isRecruiting ? '참여자 모집 중' : '광고 노출',
    applicationLink,
    guideText: getString(values.guideText),
    alcohols,
    cta: buildCta({
      applicationLink,
      eventDate: eventDateValue,
      isRecruiting: Boolean(values.isRecruiting),
      today,
    }),
    whiskies: getWhiskies(values.alcohols),
  };
}

function getAlcohols(
  values: CurationWhiskyCardValue[] | undefined
): TastingEventPreviewAlcoholItem[] {
  return (values ?? []).map((item, index) => {
    const alcohol = item.alcohol;
    const selectedTags = alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean);

    return {
      id: `${item.source}-${alcohol.alcoholId ?? index}`,
      source: item.source,
      stats: item.stats,
      alcohol: {
        alcoholId: alcohol.alcoholId,
        korName: alcohol.korName.trim() || '위스키명 미입력',
        engName: getString(alcohol.engName),
        imageUrl: normalizeImageUrl(alcohol.imageUrl),
        regionName: getString(alcohol.regionName),
        korCategory: getString(alcohol.korCategory),
        selectedTags,
        abv: formatAbv(alcohol.abv),
        volume: getString(alcohol.volume),
        cask: getString(alcohol.cask),
      },
      comment: getString(item.comment),
    };
  });
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

function formatEventDateLabel(value: string): string {
  if (!value) return '일정 미정';

  const date = parseDateOnly(value);
  if (!date) return value;

  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

function formatEventTimeLabel(value: string): string {
  const [hour, minute] = value.split(':');

  return hour && minute ? `${hour}:${minute}` : value;
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

function buildCta({
  applicationLink,
  eventDate,
  isRecruiting,
  today,
}: {
  applicationLink: string;
  eventDate: string;
  isRecruiting: boolean;
  today: Date;
}): TastingEventPreviewCta {
  if (!applicationLink) {
    return { type: 'hidden' };
  }

  if (isRecruiting && !isBeforeDate(eventDate, today)) {
    return {
      type: 'apply',
      label: '시음회 신청하기',
      href: applicationLink,
    };
  }

  return {
    type: 'closed',
    label: '모집 마감',
  };
}

function isBeforeDate(dateValue: string, today: Date): boolean {
  const date = parseDateOnly(dateValue);
  if (!date) return false;

  return date.getTime() < getDateOnlyTime(today);
}

function parseDateOnly(value: string): Date | null {
  const datePart = value.split('T')[0] ?? '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getDateOnlyTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
