import { z } from 'zod';

import { compareDateInputValues } from '@/lib/date-validation';

import {
  createCurationFieldValueSchema,
  formatCurationFieldTopic,
} from '../curation-form-schema';
import type { CurationFieldModel } from '../curation-form-model';
import type {
  CurationWhiskyCardListFieldModel,
  CurationWhiskyCardListFormValues,
} from '../curation-whisky-card-list.types';
import type { TastingEventFormModel } from './tasting-event.form-model';

// 위스키 카드 리스트 field model을 alcohols 배열 item Zod schema로 변환합니다.
export function createTastingEventAlcoholSchema(fieldModel: CurationWhiskyCardListFieldModel) {
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
        .array(z.string().min(1, `${fieldModel.selectedTags.label}를 입력해주세요.`))
        .min(
          fieldModel.selectedTags.minItems,
          `${fieldModel.selectedTags.label}를 최소 ${fieldModel.selectedTags.minItems}개 이상 추가해주세요.`
        )
        .max(
          fieldModel.selectedTags.maxItems,
          `${fieldModel.selectedTags.label}는 최대 ${fieldModel.selectedTags.maxItems}개까지 추가할 수 있습니다.`
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
        fieldModel.comment.maxLength,
        `${fieldModel.comment.label}은 최대 ${fieldModel.comment.maxLength}자까지 입력할 수 있습니다.`
      )
      .optional(),
  });
}

// field model의 kind에 따라 시음회 payload 필드 Zod schema를 생성합니다.
function createTastingEventCreatePayloadFieldSchema(field: CurationFieldModel) {
  if (field.kind === 'alcohol-card-list') {
    return z
      .array(createTastingEventAlcoholSchema(field))
      .min(field.minItems, `${field.label}를 최소 ${field.minItems}개 이상 추가해주세요.`)
      .max(field.maxItems, `${field.label}는 최대 ${field.maxItems}개까지 추가할 수 있습니다.`);
  }

  if (field.key === 'applicationLink') {
    return createConditionalApplicationLinkValueSchema(field);
  }

  return createCurationFieldValueSchema(field);
}

function createConditionalApplicationLinkValueSchema(field: CurationFieldModel) {
  if (field.kind !== 'text') {
    return z.unknown();
  }

  let schema = z.string();

  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxLength}자까지 입력할 수 있습니다.`
    );
  }

  return schema.optional();
}

// requestSpec 기반 form model의 payloadFields를 순회해 동적 payload Zod shape을 생성합니다.
function createTastingEventCreatePayloadShape(
  formModel: TastingEventFormModel
): Record<string, z.ZodType<unknown>> {
  return formModel.payloadFields.reduce<Record<string, z.ZodType<unknown>>>((shape, field) => {
    const key = field.key;
    shape[key] = createTastingEventCreatePayloadFieldSchema(field);
    return shape;
  }, {});
}

// requestSpec 기반 시음회 form model을 React Hook Form에서 사용할 전체 Zod schema로 변환합니다.
export function createCurationTastingEventFormSchema(
  formModel: TastingEventFormModel,
  options: { mode?: 'create' | 'edit' } = {}
): z.ZodType<TastingEventCreateFormState> {
  const isEditMode = options.mode === 'edit';
  const applicationLinkField = formModel.payloadFields.find(
    (field) => field.key === 'applicationLink'
  );

  return z
    .object({
      name: z.string().min(1, '큐레이션명은 필수입니다.'),
      description: isEditMode ? z.string() : z.string().min(1, '설명은 필수입니다.'),
      imageUrls: z.array(z.string()).max(3, '이미지는 최대 3개까지 등록할 수 있습니다.'),
      exposureStartDate: isEditMode
        ? z.string()
        : z.string().min(1, '광고노출 시작일은 필수입니다.'),
      exposureEndDate: isEditMode ? z.string() : z.string().min(1, '광고노출 종료일은 필수입니다.'),
      displayOrder: z
        .number()
        .int('노출 순서는 정수로 입력해주세요.')
        .min(0, '노출 순서는 0 이상이어야 합니다.'),
      isActive: z.boolean(),
      ...createTastingEventCreatePayloadShape(formModel),
    })
    .superRefine((values, context) => {
      const formValues = values as Record<string, unknown>;
      const exposureStartDate =
        typeof formValues.exposureStartDate === 'string' ? formValues.exposureStartDate : '';
      const exposureEndDate =
        typeof formValues.exposureEndDate === 'string' ? formValues.exposureEndDate : '';

      if (
        exposureStartDate &&
        exposureEndDate &&
        compareDateInputValues(exposureEndDate, exposureStartDate) < 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exposureEndDate'],
          message: '광고노출 종료일은 광고노출 시작일보다 빠를 수 없습니다.',
        });
      }

      if (!applicationLinkField?.required || formValues.isRecruiting === false) return;

      const applicationLink = formValues.applicationLink;
      if (typeof applicationLink === 'string' && applicationLink.trim()) return;

      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationLink'],
        message: `${formatCurationFieldTopic(applicationLinkField.label)} 필수입니다.`,
      });
    }) as unknown as z.ZodType<TastingEventCreateFormState>;
}

export interface TastingEventCreateFormState extends CurationWhiskyCardListFormValues {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
  [key: string]: unknown;
}

export type TastingEventCreatePayload = Record<string, unknown>;

const BASE_TASTING_EVENT_CREATE_FORM_STATE: TastingEventCreateFormState = {
  name: '',
  description: '',
  imageUrls: [],
  exposureStartDate: '',
  exposureEndDate: '',
  displayOrder: 0,
  isActive: true,
  alcohols: [],
};

// requestSpec 기반 form model을 React Hook Form의 초기 form state로 변환합니다.
export function createDefaultTastingEventCreateFormState(
  formModel: TastingEventFormModel
): TastingEventCreateFormState {
  const formState: TastingEventCreateFormState = {
    ...BASE_TASTING_EVENT_CREATE_FORM_STATE,
    imageUrls: [],
    alcohols: [],
  };

  for (const field of formModel.payloadFields) {
    formState[field.key] = createDefaultTastingEventPayloadFieldValue(field);
  }

  return formState;
}

// field model의 kind와 schema default 값을 기준으로 payload 필드 초기값을 결정합니다.
function createDefaultTastingEventPayloadFieldValue(field: CurationFieldModel): unknown {
  if ('defaultValue' in field && field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.kind) {
    case 'alcohol-card-list':
      return [];
    case 'boolean-radio':
      return false;
    case 'number':
      return typeof field.minimum === 'number' ? field.minimum : 0;
    case 'date':
    case 'time':
    case 'textarea':
    case 'text':
    case 'address':
      return '';
  }
}
