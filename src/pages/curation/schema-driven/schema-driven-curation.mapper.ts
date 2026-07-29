import type { CurationV2Detail } from '@/types/api';

import type { CurationFieldModel, CurationObjectArrayFieldModel } from '../curation-form-model';
import type { CurationWhiskyCardValue } from '../curation-whisky-card-list.types';
import {
  createDefaultSchemaDrivenCurationFormState,
  type SchemaDrivenCurationFormState,
} from './schema-driven-curation.schema';
import type { SchemaDrivenCurationFormModel } from './schema-driven-curation.form-model';

const WHISKY_TEXT_KEYS = [
  'korName',
  'engName',
  'imageUrl',
  'abv',
  'cask',
  'volume',
  'regionName',
  'korCategory',
] as const;

export function createSchemaDrivenCurationFormStateFromCuration(
  curation: CurationV2Detail,
  formModel: SchemaDrivenCurationFormModel
): SchemaDrivenCurationFormState {
  const formState = createDefaultSchemaDrivenCurationFormState(formModel);
  const payload = isRecord(curation.payload) ? curation.payload : {};

  formState.name = curation.name;
  formState.description = curation.description ?? '';
  formState.imageUrls =
    curation.imageUrls.length > 0
      ? [...curation.imageUrls]
      : curation.coverImageUrl
        ? [curation.coverImageUrl]
        : [];
  formState.exposureStartDate = toInputDate(curation.exposureStartDate);
  formState.exposureEndDate = toInputDate(curation.exposureEndDate);
  formState.displayOrder = curation.displayOrder;
  formState.isActive = curation.isActive;

  for (const field of formModel.payloadFields) {
    if (!Object.prototype.hasOwnProperty.call(payload, field.key)) continue;
    formState[field.key] = hydrateFieldValue(field, payload[field.key]);
  }

  return formState;
}

export function buildSchemaDrivenCurationPayload(
  values: SchemaDrivenCurationFormState,
  formModel: SchemaDrivenCurationFormModel
): Record<string, unknown> {
  return serializeFields(formModel.payloadFields, values);
}

function hydrateFieldValue(field: CurationFieldModel, value: unknown): unknown {
  switch (field.kind) {
    case 'object-array':
      return Array.isArray(value)
        ? value
            .filter(isRecord)
            .map((item) =>
              Object.fromEntries(
                field.itemFields.map((itemField) => [
                  itemField.key,
                  hydrateFieldValue(itemField, item[itemField.key]),
                ])
              )
            )
        : [];
    case 'alcohol-card-list':
      return hydrateWhiskies(value);
    case 'multi-select':
      return Array.isArray(value)
        ? value.filter(
            (item): item is string =>
              typeof item === 'string' && field.options.some((option) => option.value === item)
          )
        : [];
    case 'select':
      return typeof value === 'string' ? value : '';
    case 'boolean-radio':
      return typeof value === 'boolean' ? value : Boolean(value);
    case 'number': {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : (field.minimum ?? 0);
    }
    case 'date':
      return toInputDate(value);
    case 'time':
      return toInputTime(value);
    case 'textarea':
    case 'text':
    case 'address':
    case 'hidden':
      return value === null || value === undefined ? '' : String(value);
  }
}

function serializeFields(
  fields: CurationFieldModel[],
  values: Record<string, unknown>
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((payload, field) => {
    const serializedValue = serializeFieldValue(field, values[field.key]);
    if (!field.required && isEmptyOptionalValue(serializedValue)) {
      return payload;
    }

    payload[field.key] = serializedValue;
    return payload;
  }, {});
}

function serializeFieldValue(field: CurationFieldModel, value: unknown): unknown {
  switch (field.kind) {
    case 'object-array':
      return serializeObjectArray(field, value);
    case 'alcohol-card-list':
      return Array.isArray(value) ? value.map(serializeWhisky) : [];
    case 'multi-select':
      return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
    case 'number':
    case 'boolean-radio':
      return value;
    case 'select':
    case 'textarea':
    case 'text':
    case 'address':
    case 'hidden':
    case 'date':
    case 'time':
      return typeof value === 'string' ? value.trim() : '';
  }
}

function serializeObjectArray(field: CurationObjectArrayFieldModel, value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => serializeFields(field.itemFields, item));
}

function serializeWhisky(value: unknown) {
  const item = isRecord(value) ? value : {};
  const alcoholValue = isRecord(item.alcohol) ? item.alcohol : {};
  const source = item.source === 'BOTTLE_NOTE' ? 'BOTTLE_NOTE' : 'MANUAL';
  const alcohol: Record<string, unknown> = {
    alcoholId:
      source === 'MANUAL' || typeof alcoholValue.alcoholId !== 'number'
        ? null
        : alcoholValue.alcoholId,
    selectedTags: Array.isArray(alcoholValue.selectedTags)
      ? alcoholValue.selectedTags
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };

  WHISKY_TEXT_KEYS.forEach((key) => {
    const text = typeof alcoholValue[key] === 'string' ? alcoholValue[key].trim() : '';
    if (key === 'korName' || text) {
      alcohol[key] = text;
    }
  });

  const comment = typeof item.comment === 'string' ? item.comment.trim() : '';

  return {
    source,
    alcohol,
    ...(comment ? { comment } : {}),
  };
}

function hydrateWhiskies(value: unknown): CurationWhiskyCardValue[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => {
    const alcohol = isRecord(item.alcohol) ? item.alcohol : {};

    return {
      source: item.source === 'BOTTLE_NOTE' ? 'BOTTLE_NOTE' : 'MANUAL',
      alcohol: {
        alcoholId: typeof alcohol.alcoholId === 'number' ? alcohol.alcoholId : null,
        korName: normalizeText(alcohol.korName),
        engName: normalizeText(alcohol.engName),
        imageUrl: normalizeText(alcohol.imageUrl),
        abv: normalizeText(alcohol.abv),
        cask: normalizeText(alcohol.cask),
        volume: normalizeText(alcohol.volume),
        regionName: normalizeText(alcohol.regionName),
        korCategory: normalizeText(alcohol.korCategory),
        selectedTags: Array.isArray(alcohol.selectedTags)
          ? alcohol.selectedTags.map(normalizeText).filter(Boolean)
          : [],
      },
      comment: normalizeText(item.comment),
    };
  });
}

function isEmptyOptionalValue(value: unknown) {
  return (
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

function normalizeText(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toInputDate(value: unknown) {
  return normalizeText(value).slice(0, 10);
}

function toInputTime(value: unknown) {
  return normalizeText(value).slice(0, 5);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
