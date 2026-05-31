import type { CurationV2Detail } from '@/types/api';

import type {
  CurationWhiskyCardValue,
  CurationWhiskyStats,
  CurationWhiskySource,
} from '../curation-whisky-card-list.types';
import {
  createDefaultTastingEventCreateFormState,
  type TastingEventCreatePayload,
  TastingEventCreateFormState,
} from './tasting-event.schema';
import type { TastingEventFormModel } from './tasting-event.form-model';

const ALCOHOL_OPTIONAL_TEXT_FIELDS = [
  'engName',
  'imageUrl',
  'abv',
  'cask',
  'volume',
  'regionName',
  'korCategory',
] as const;

// 6. submit mapper 레이어: form 값을 서버 payload 필드 목록에 맞춰 동적으로 조립합니다.
export function buildTastingEventPayload(
  values: TastingEventCreateFormState,
  formModel: TastingEventFormModel
): TastingEventCreatePayload {
  return formModel.payloadFields.reduce<TastingEventCreatePayload>((payload, field) => {
    const key = field.key;
    const value = values[key];

    if (key === 'alcohols') {
      payload[key] = mapTastingEventAlcohols(values.alcohols);
      return payload;
    }

    payload[key] = normalizePayloadValue(value);
    return payload;
  }, {});
}

export function createTastingEventFormStateFromCuration(
  curation: CurationV2Detail,
  formModel: TastingEventFormModel
): TastingEventCreateFormState {
  const formState = createDefaultTastingEventCreateFormState(formModel);

  formState.name = curation.name;
  formState.description = curation.description ?? '';
  formState.imageUrls =
    curation.imageUrls.length > 0
      ? [...curation.imageUrls]
      : curation.coverImageUrl
        ? [curation.coverImageUrl]
        : [];
  formState.exposureStartDate = toDateInputValue(curation.exposureStartDate);
  formState.exposureEndDate = toDateInputValue(curation.exposureEndDate);
  formState.displayOrder = curation.displayOrder;
  formState.isActive = curation.isActive;

  for (const field of formModel.payloadFields) {
    if (!Object.prototype.hasOwnProperty.call(curation.payload, field.key)) {
      continue;
    }

    const value = curation.payload[field.key];

    switch (field.kind) {
      case 'alcohol-card-list':
        formState[field.key] = normalizeTastingEventAlcohols(value);
        break;
      case 'boolean-radio':
        formState[field.key] = normalizeBooleanValue(value);
        break;
      case 'number':
        formState[field.key] = normalizeNumberValue(value, formState[field.key]);
        break;
      case 'date':
        formState[field.key] = toDateInputValue(value);
        break;
      case 'time':
        formState[field.key] = toTimeInputValue(value);
        break;
      case 'textarea':
      case 'text':
        formState[field.key] = normalizeStringValue(value);
        break;
    }
  }

  if (Array.isArray(formState.alcohols)) {
    formState.alcohols = normalizeTastingEventAlcohols(formState.alcohols);
  }

  return formState;
}

// 문자열은 trim하고 나머지 값은 서버 전송값으로 그대로 유지합니다.
function normalizePayloadValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

// 시음 위스키 form 값을 서버가 받는 alcohols payload 배열로 변환합니다.
function mapTastingEventAlcohols(values: TastingEventCreateFormState['alcohols']) {
  return values.map((item) => {
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
  });
}

function normalizeTastingEventAlcohols(value: unknown): CurationWhiskyCardValue[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const itemRecord = isRecord(item) ? item : {};
    const alcohol = isRecord(itemRecord.alcohol) ? itemRecord.alcohol : {};

    return {
      source: normalizeWhiskySource(itemRecord.source),
      alcohol: {
        alcoholId: typeof alcohol.alcoholId === 'number' ? alcohol.alcoholId : null,
        korName: normalizeStringValue(alcohol.korName),
        engName: normalizeStringValue(alcohol.engName),
        imageUrl: normalizeStringValue(alcohol.imageUrl),
        abv: normalizeStringValue(alcohol.abv),
        cask: normalizeStringValue(alcohol.cask),
        volume: normalizeStringValue(alcohol.volume),
        regionName: normalizeStringValue(alcohol.regionName),
        korCategory: normalizeStringValue(alcohol.korCategory),
        selectedTags: Array.isArray(alcohol.selectedTags)
          ? alcohol.selectedTags.map(normalizeStringValue).filter(Boolean)
          : [],
      },
      stats: normalizeWhiskyStats(itemRecord.stats),
      comment: normalizeStringValue(itemRecord.comment),
    };
  });
}

function normalizeWhiskyStats(value: unknown): CurationWhiskyStats | null {
  if (!isRecord(value)) return null;

  return {
    rating: normalizeNullableNumber(value.rating),
    totalRatingsCount: normalizeNullableNumber(value.totalRatingsCount),
    reviewCount: normalizeNullableNumber(value.reviewCount),
    totalPickCount: normalizeNullableNumber(value.totalPickCount),
  };
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function normalizeWhiskySource(value: unknown): CurationWhiskySource {
  return value === 'BOTTLE_NOTE' || value === 'MANUAL' ? value : 'MANUAL';
}

function normalizeStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
}

function normalizeNumberValue(value: unknown, fallback: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = Number(value);
  if (Number.isFinite(normalized)) return normalized;

  return typeof fallback === 'number' ? fallback : 0;
}

function normalizeBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;

  return Boolean(value);
}

function toDateInputValue(value: unknown): string {
  const normalized = normalizeStringValue(value);
  return normalized ? normalized.slice(0, 10) : '';
}

function toTimeInputValue(value: unknown): string {
  const normalized = normalizeStringValue(value);
  return normalized ? normalized.slice(0, 5) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
