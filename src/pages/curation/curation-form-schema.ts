import { z } from 'zod';

import type {
  CurationFieldModel,
  CurationMultiSelectFieldModel,
  CurationNumberFieldModel,
  CurationObjectArrayFieldModel,
  CurationSelectFieldModel,
  CurationTextFieldModel,
} from './curation-form-model';
import type { CurationWhiskyCardListFieldModel } from './curation-whisky-card-list.types';

function getTopicParticle(label: string): '은' | '는' {
  const trimmedLabel = label.trim();
  const lastChar = trimmedLabel.charAt(trimmedLabel.length - 1);
  if (trimmedLabel.length === 0 || !lastChar) return '는';

  const codePoint = lastChar.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (codePoint < hangulStart || codePoint > hangulEnd) {
    return '는';
  }

  return (codePoint - hangulStart) % 28 === 0 ? '는' : '은';
}

export function formatCurationFieldTopic(label: string): string {
  return `${label}${getTopicParticle(label)}`;
}

function getObjectParticle(label: string): '을' | '를' {
  const trimmedLabel = label.trim();
  const lastChar = trimmedLabel.charAt(trimmedLabel.length - 1);
  if (trimmedLabel.length === 0 || !lastChar) return '를';

  const codePoint = lastChar.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return '를';

  return (codePoint - 0xac00) % 28 === 0 ? '를' : '을';
}

export function formatCurationFieldObject(label: string): string {
  return `${label}${getObjectParticle(label)}`;
}

// text/date/time/textarea field model을 문자열 Zod schema로 변환합니다.
function createTextFieldValueSchema(field: CurationTextFieldModel): z.ZodType<unknown> {
  let schema = z.string();

  const minimumLength = field.required ? Math.max(field.minLength ?? 0, 1) : field.minLength;

  if (field.required && minimumLength === 1) {
    schema = schema.min(1, `${formatCurationFieldTopic(field.label)} 필수입니다.`);
  } else if (minimumLength) {
    schema = schema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= minimumLength,
      `${formatCurationFieldTopic(field.label)} 최소 ${minimumLength}자 이상 입력해주세요.`
    );
  }

  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxLength}자까지 입력할 수 있습니다.`
    );
  }

  return schema;
}

function createSelectFieldValueSchema(field: CurationSelectFieldModel): z.ZodType<unknown> {
  const allowedValues = new Set(field.options.map((option) => option.value));
  let schema = z.string();

  if (field.required) {
    schema = schema.min(1, `${formatCurationFieldObject(field.label)} 선택해주세요.`);
  }

  return schema.refine(
    (value) => (!field.required && value === '') || allowedValues.has(value),
    `${formatCurationFieldObject(field.label)} 올바르게 선택해주세요.`
  );
}

function createMultiSelectFieldValueSchema(
  field: CurationMultiSelectFieldModel
): z.ZodType<unknown> {
  const allowedValues = new Set(field.options.map((option) => option.value));
  let schema = z.array(
    z.string().refine((value) => allowedValues.has(value), {
      message: `${formatCurationFieldObject(field.label)} 올바르게 선택해주세요.`,
    })
  );

  const minimumItems = field.required ? Math.max(field.minItems, 1) : field.minItems;
  if (minimumItems > 0) {
    schema = schema.min(
      minimumItems,
      `${formatCurationFieldObject(field.label)} 최소 ${minimumItems}개 이상 선택해주세요.`
    );
  }

  if (typeof field.maxItems === 'number') {
    schema = schema.max(
      field.maxItems,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxItems}개까지 선택할 수 있습니다.`
    );
  }

  return schema;
}

export function createCurationWhiskyCardValueSchema(field: CurationWhiskyCardListFieldModel) {
  return z.object({
    source: z.enum(['BOTTLE_NOTE', 'MANUAL']),
    alcohol: z.object({
      alcoholId: z.number().nullable(),
      korName: z.string().min(1, '위스키 한글명은 필수입니다.'),
      engName: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      abv: z.string().optional(),
      cask: z.string().optional(),
      volume: z.string().optional(),
      regionName: z.string().optional(),
      korCategory: z.string().optional(),
      selectedTags: z
        .array(z.string().min(1, `${field.selectedTags.label}를 입력해주세요.`))
        .min(
          field.selectedTags.minItems,
          `${field.selectedTags.label}를 최소 ${field.selectedTags.minItems}개 이상 추가해주세요.`
        )
        .max(
          field.selectedTags.maxItems,
          `${field.selectedTags.label}는 최대 ${field.selectedTags.maxItems}개까지 추가할 수 있습니다.`
        ),
    }),
    stats: z
      .object({
        rating: z.number().nullable().optional(),
        totalRatingsCount: z.number().nullable().optional(),
        reviewCount: z.number().nullable().optional(),
        totalPickCount: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
    comment: z
      .string()
      .max(
        field.comment.maxLength,
        `${field.comment.label}은 최대 ${field.comment.maxLength}자까지 입력할 수 있습니다.`
      )
      .optional()
      .nullable(),
  });
}

function createWhiskyCardListValueSchema(
  field: CurationWhiskyCardListFieldModel
): z.ZodType<unknown> {
  let schema = z.array(createCurationWhiskyCardValueSchema(field));
  const minimumItems = field.required ? Math.max(field.minItems, 1) : field.minItems;

  if (minimumItems > 0) {
    schema = schema.min(
      minimumItems,
      `${formatCurationFieldObject(field.label)} 최소 ${minimumItems}개 이상 추가해주세요.`
    );
  }

  if (typeof field.maxItems === 'number') {
    schema = schema.max(
      field.maxItems,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxItems}개까지 추가할 수 있습니다.`
    );
  }

  return schema;
}

function createObjectArrayValueSchema(field: CurationObjectArrayFieldModel): z.ZodType<unknown> {
  const itemShape = field.itemFields.reduce<Record<string, z.ZodType<unknown>>>(
    (shape, itemField) => {
      shape[itemField.key] = createCurationFieldValueSchema(itemField);
      return shape;
    },
    {}
  );
  let schema = z.array(z.object(itemShape));
  const minimumItems = field.required ? Math.max(field.minItems, 1) : field.minItems;

  if (minimumItems > 0) {
    schema = schema.min(
      minimumItems,
      `${formatCurationFieldObject(field.label)} 최소 ${minimumItems}개 이상 추가해주세요.`
    );
  }

  if (typeof field.maxItems === 'number') {
    schema = schema.max(
      field.maxItems,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxItems}개까지 추가할 수 있습니다.`
    );
  }

  return schema;
}

// number/integer field model을 숫자 Zod schema로 변환합니다.
function createNumberFieldValueSchema(field: CurationNumberFieldModel): z.ZodType<unknown> {
  let schema = z.number();

  if (field.numberType === 'integer') {
    schema = schema.int(`${formatCurationFieldTopic(field.label)} 정수로 입력해주세요.`);
  }

  if (typeof field.minimum === 'number') {
    schema = schema.min(
      field.minimum,
      `${formatCurationFieldTopic(field.label)} ${field.minimum} 이상이어야 합니다.`
    );
  }

  if (typeof field.maximum === 'number') {
    schema = schema.max(
      field.maximum,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maximum}까지 입력할 수 있습니다.`
    );
  }

  return schema;
}

// field model의 kind에 맞는 Zod value schema를 생성합니다.
export function createCurationFieldValueSchema(field: CurationFieldModel): z.ZodType<unknown> {
  switch (field.kind) {
    case 'number':
      return createNumberFieldValueSchema(field);
    case 'boolean-radio':
      return z.boolean();
    case 'select':
      return createSelectFieldValueSchema(field);
    case 'multi-select':
      return createMultiSelectFieldValueSchema(field);
    case 'alcohol-card-list':
      return createWhiskyCardListValueSchema(field);
    case 'object-array':
      return createObjectArrayValueSchema(field);
    case 'text':
    case 'textarea':
    case 'date':
    case 'time':
    case 'address':
    case 'hidden':
      return createTextFieldValueSchema(field);
  }
}

export function createDefaultCurationFieldValue(field: CurationFieldModel): unknown {
  if ('defaultValue' in field && field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.kind) {
    case 'alcohol-card-list':
    case 'multi-select':
    case 'object-array':
      return [];
    case 'boolean-radio':
      return false;
    case 'number':
      return field.minimum ?? 0;
    case 'select':
    case 'date':
    case 'time':
    case 'textarea':
    case 'text':
    case 'address':
    case 'hidden':
      return '';
  }
}
