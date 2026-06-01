import type { CurationV2Detail, CurationV2Payload } from '@/types/api';

import type {
  CurationWhiskyMirror,
  CurationWhiskySource,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import {
  createDefaultWhiskyCardCurationFormState,
  createEmptyPairingFood,
  type PairingFoodValue,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
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
  const alcohol = {
    alcoholId: values.source === 'MANUAL' ? null : values.alcohol.alcoholId,
    korName: values.alcohol.korName.trim(),
    selectedTags: values.alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean),
  } as CurationWhiskyMirror;
  const comment = values.comment.trim();
  const payload: CurationV2Payload = {
    source: values.source,
    alcohol,
    ...(comment ? { comment } : {}),
  };

  ALCOHOL_OPTIONAL_TEXT_FIELDS.forEach((key) => {
    const value = values.alcohol[key]?.trim();
    if (value) {
      alcohol[key] = value;
    }
  });

  if (formModel.pairings) {
    payload.pairings = values.pairings.map((pairing) => {
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
  const payload = curation.payload;

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
  formState.source = normalizeWhiskySource(payload.source);
  formState.alcohol = normalizeWhiskyMirror(payload.alcohol);
  formState.stats = normalizeWhiskyStats(payload.stats);
  formState.comment = normalizeStringValue(payload.comment);
  formState.pairings = formModel.pairings
    ? normalizePairings(payload.pairings, formModel.pairings.minItems)
    : [];

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

  return Array.from({ length: minItems }, () => createEmptyPairingFood());
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
