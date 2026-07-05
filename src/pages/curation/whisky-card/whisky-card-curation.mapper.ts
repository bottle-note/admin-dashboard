import type { CurationV2Detail, CurationV2Payload, CurationV2PayloadItem } from '@/types/api';

import type {
  CurationWhiskyMirror,
  CurationWhiskySource,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import {
  createDefaultWhiskyCardCurationFormState,
  type PairingFoodValue,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
  type WhiskyCardCurationItemFormState,
} from './whisky-card-curation.schema';

const ALCOHOL_OPTIONAL_TEXT_FIELDS = [
  'engName',
  'imageUrl',
  'abv',
  'cask',
  'volume',
  'regionName',
  'korCategory',
] as const;

export function buildWhiskyCardCurationPayload(
  values: WhiskyCardCurationFormState,
  formModel: WhiskyCardCurationFormModel
): CurationV2Payload {
  return values.alcohols.map((item) => mapWhiskyCardPayloadItem(item, formModel));
}

function mapWhiskyCardPayloadItem(
  item: WhiskyCardCurationItemFormState,
  formModel: WhiskyCardCurationFormModel
): CurationV2PayloadItem {
  const alcohol = {
    alcoholId: item.source === 'MANUAL' ? null : item.alcohol.alcoholId,
    korName: item.alcohol.korName.trim(),
    selectedTags: item.alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean),
  } as CurationWhiskyMirror;
  const comment = item.comment?.trim();
  const payload: CurationV2PayloadItem = {
    source: item.source,
    alcohol,
    ...(comment ? { comment } : {}),
  };

  ALCOHOL_OPTIONAL_TEXT_FIELDS.forEach((key) => {
    const value = item.alcohol[key]?.trim();
    if (value) {
      alcohol[key] = value;
    }
  });

  if (formModel.pairings) {
    payload.pairings = item.pairings.map((pairing) => {
      const itemImageUrl = pairing.itemImageUrl?.trim();

      return {
        itemName: pairing.itemName.trim(),
        pairingNote: pairing.pairingNote.trim(),
        ...(itemImageUrl ? { itemImageUrl } : {}),
      };
    });
  }

  return payload;
}

export function createWhiskyCardFormStateFromCuration(
  curation: CurationV2Detail,
  formModel: WhiskyCardCurationFormModel
): WhiskyCardCurationFormState {
  const formState = createDefaultWhiskyCardCurationFormState(formModel);
  const payloadItems = getPayloadItems(curation.payload);

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
  formState.alcohols = payloadItems.map((payload) => ({
    source: normalizeWhiskySource(payload.source),
    alcohol: normalizeWhiskyMirror(payload.alcohol),
    stats: normalizeWhiskyStats(payload.stats),
    comment: normalizeStringValue(payload.comment),
    pairings: formModel.pairings
      ? normalizePairings(payload.pairings, formModel.pairings.minItems)
      : [],
  }));

  return formState;
}

function normalizeWhiskyMirror(value: unknown): CurationWhiskyMirror {
  const alcohol = isRecord(value) ? value : {};

  return {
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
  };
}

function getPayloadItems(payload: CurationV2Payload): CurationV2PayloadItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  return isRecord(payload) ? [payload] : [];
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

function normalizePairings(value: unknown, minItems: number): PairingFoodValue[] {
  const pairings = Array.isArray(value)
    ? value.map((item) => {
        const pairing = isRecord(item) ? item : {};

        return {
          itemName: normalizeStringValue(pairing.itemName),
          pairingNote: normalizeStringValue(pairing.pairingNote),
          itemImageUrl: normalizeStringValue(pairing.itemImageUrl),
        };
      })
    : [];

  if (pairings.length > 0 || minItems === 0) {
    return pairings;
  }

  return Array.from({ length: minItems }, () => ({
    itemName: '',
    pairingNote: '',
    itemImageUrl: '',
  }));
}

function normalizeWhiskySource(value: unknown): CurationWhiskySource {
  return value === 'BOTTLE_NOTE' || value === 'MANUAL' ? value : 'MANUAL';
}

function normalizeStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function toDateInputValue(value: unknown): string {
  const normalized = normalizeStringValue(value);
  return normalized ? normalized.slice(0, 10) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
