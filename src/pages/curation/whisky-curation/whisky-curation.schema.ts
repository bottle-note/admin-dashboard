import { z } from 'zod';

import { compareDateInputValues } from '@/lib/date-validation';
import type { CurationV2Spec, JsonSchemaNode } from '@/types/api';

import type {
  CurationWhiskyCardListFormValues,
  CurationWhiskyCardListFieldModel,
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
} from '../curation-whisky-card-list.types';
import type { CurationFormModel } from '../curation-form-model';
import {
  createAlcoholCardListFieldModel,
  getSchemaDisplayLabel,
  getSchemaProperty,
  getSchemaXString,
} from '../curation-form-model';

export interface PairingFoodValue {
  itemName: string;
  pairingNote: string;
  itemImageUrl?: string;
}

export interface WhiskyCurationItemFormState extends CurationWhiskyCardValue {
  pairings: PairingFoodValue[];
}

export interface WhiskyCurationFormState extends CurationWhiskyCardListFormValues {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
  alcohols: WhiskyCurationItemFormState[];
}

export interface WhiskyCurationPairingModel {
  label: string;
  minItems: number;
  maxItems: number;
  itemNameLabel: string;
  itemNameMaxLength: number;
  pairingNoteLabel: string;
  pairingNoteMaxLength: number;
  itemImageUrlLabel: string;
  hasItemImageUrl: boolean;
  itemImageUploadPath: string;
}

export interface WhiskyCurationFormModel extends CurationFormModel {
  spec: CurationV2Spec;
  title: string;
  editTitle: string;
  cardList: CurationWhiskyCardListFieldModel;
  pairings?: WhiskyCurationPairingModel;
}

// 추천/페어링 큐레이션 requestSpec은 x-container: "array" 계약(루트가 위스키 카드 1건 스키마)입니다.
// 서버 vocabulary를 그대로 읽어 카드 리스트 field model 하나로 수렴시킵니다.
export function createWhiskyCurationFormModel(spec: CurationV2Spec): WhiskyCurationFormModel {
  const { requestSpec } = spec;
  if (requestSpec['x-container'] !== 'array') {
    throw new Error('추천/페어링 큐레이션 requestSpec은 x-container: "array" 계약이어야 합니다.');
  }

  const alcoholSchema = getSchemaProperty(requestSpec, 'alcohol');
  const label =
    getSchemaDisplayLabel(requestSpec) || getSchemaDisplayLabel(alcoholSchema) || spec.name;
  const cardList = createAlcoholCardListFieldModel({
    key: 'alcohols',
    label,
    required: true,
    minItems: requestSpec.minItems ?? 1,
    maxItems: typeof requestSpec.maxItems === 'number' ? requestSpec.maxItems : undefined,
    itemSchema: requestSpec,
  });

  return {
    spec,
    title: `${spec.name} 작성`,
    editTitle: `${spec.name} 수정`,
    cardList,
    // 스펙에 pairings 아이템이 있으면 페어링, 없으면 추천 — 타입 분기가 아니라 스펙이 결정합니다.
    pairings: createWhiskyPairingModel(requestSpec.properties?.pairings),
    payloadFields: [cardList],
    sections: [
      {
        id: 'whiskyCards',
        title: cardList.label,
        stepNumber: 2,
        description: '큐레이션에 노출할 위스키를 입력해주세요.',
        contentClassName: 'space-y-4',
        fields: [{ field: cardList }],
      },
    ],
  };
}

function createWhiskyPairingModel(
  pairingsSchema: JsonSchemaNode | undefined
): WhiskyCurationPairingModel | undefined {
  if (!pairingsSchema) return undefined;

  const itemProperties = pairingsSchema.items?.properties ?? {};
  const itemImageUrlSchema = itemProperties.itemImageUrl;

  return {
    label: getSchemaDisplayLabel(pairingsSchema) || '페어링 음식',
    minItems: pairingsSchema.minItems ?? 0,
    maxItems: pairingsSchema.maxItems ?? 5,
    itemNameLabel: (itemProperties.itemName && getSchemaDisplayLabel(itemProperties.itemName)) || '음식명',
    itemNameMaxLength: itemProperties.itemName?.maxLength ?? 100,
    pairingNoteLabel:
      (itemProperties.pairingNote && getSchemaDisplayLabel(itemProperties.pairingNote)) ||
      '페어링 설명',
    pairingNoteMaxLength: itemProperties.pairingNote?.maxLength ?? 500,
    itemImageUrlLabel: (itemImageUrlSchema && getSchemaDisplayLabel(itemImageUrlSchema)) || '음식 이미지',
    hasItemImageUrl: Boolean(itemImageUrlSchema),
    itemImageUploadPath:
      (itemImageUrlSchema && getPairingImageUploadPath(itemImageUrlSchema)) ?? 'admin/curation',
  };
}

function getPairingImageUploadPath(schema: JsonSchemaNode): string | undefined {
  return (
    getSchemaXString(schema, 'x-upload-path') ??
    getSchemaXString(schema, 'x-s3-root-path') ??
    getSchemaXString(schema, 'x-upload-root-path')
  );
}

export function createCurationWhiskyFormSchema(
  formModel: WhiskyCurationFormModel,
  options: { mode?: 'create' | 'edit' } = {}
): z.ZodType<WhiskyCurationFormState> {
  const isEditMode = options.mode === 'edit';
  const curationItemSchema = z.object({
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
        .array(z.string().min(1, `${formModel.cardList.selectedTags.label}를 입력해주세요.`))
        .min(
          formModel.cardList.selectedTags.minItems,
          `${formModel.cardList.selectedTags.label}를 최소 ${formModel.cardList.selectedTags.minItems}개 이상 추가해주세요.`
        )
        .max(
          formModel.cardList.selectedTags.maxItems,
          `${formModel.cardList.selectedTags.label}는 최대 ${formModel.cardList.selectedTags.maxItems}개까지 추가할 수 있습니다.`
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
    comment: createCommentSchema(formModel),
    pairings: createPairingsSchema(formModel),
  });

  return z
    .object({
      name: z.string().min(1, '큐레이션명은 필수입니다.'),
      description: isEditMode ? z.string() : z.string().min(1, '설명은 필수입니다.'),
      imageUrls: z.array(z.string()).max(3, '이미지는 최대 3개까지 등록할 수 있습니다.'),
      exposureStartDate: isEditMode ? z.string() : z.string().min(1, '노출 시작일은 필수입니다.'),
      exposureEndDate: isEditMode ? z.string() : z.string().min(1, '노출 종료일은 필수입니다.'),
      displayOrder: z
        .number()
        .int('노출 순서는 정수로 입력해주세요.')
        .min(0, '노출 순서는 0 이상이어야 합니다.'),
      isActive: z.boolean(),
      alcohols: createWhiskyItemsSchema(curationItemSchema, formModel),
    })
    .superRefine((values, context) => {
      if (
        values.exposureStartDate &&
        values.exposureEndDate &&
        compareDateInputValues(values.exposureEndDate, values.exposureStartDate) < 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['exposureEndDate'],
          message: '노출 종료일은 노출 시작일보다 빠를 수 없습니다.',
        });
      }
    }) as unknown as z.ZodType<WhiskyCurationFormState>;
}

function createCommentSchema(formModel: WhiskyCurationFormModel) {
  const { comment } = formModel.cardList;
  const commentSchema = z
    .string()
    .max(comment.maxLength, `${comment.label}는 최대 ${comment.maxLength}자까지 입력할 수 있습니다.`);

  return comment.required ? commentSchema.min(1, `${comment.label}은 필수입니다.`) : commentSchema;
}

function createWhiskyItemsSchema(
  curationItemSchema: z.ZodTypeAny,
  formModel: WhiskyCurationFormModel
) {
  const { label, minItems, maxItems } = formModel.cardList;
  const itemsSchema = z
    .array(curationItemSchema)
    .min(minItems, `${label}를 최소 ${minItems}개 이상 추가해주세요.`);

  if (typeof maxItems !== 'number') {
    return itemsSchema;
  }

  return itemsSchema.max(maxItems, `${label}는 최대 ${maxItems}개까지 추가할 수 있습니다.`);
}

function createPairingsSchema(formModel: WhiskyCurationFormModel) {
  if (!formModel.pairings) {
    return z.array(z.never()).optional();
  }

  return z
    .array(
      z.object({
        itemName: z
          .string()
          .min(1, `${formModel.pairings.itemNameLabel}은 필수입니다.`)
          .max(
            formModel.pairings.itemNameMaxLength,
            `${formModel.pairings.itemNameLabel}은 최대 ${formModel.pairings.itemNameMaxLength}자까지 입력할 수 있습니다.`
          ),
        pairingNote: z
          .string()
          .min(1, `${formModel.pairings.pairingNoteLabel}은 필수입니다.`)
          .max(
            formModel.pairings.pairingNoteMaxLength,
            `${formModel.pairings.pairingNoteLabel}은 최대 ${formModel.pairings.pairingNoteMaxLength}자까지 입력할 수 있습니다.`
          ),
        itemImageUrl: z.string().optional(),
      })
    )
    .min(
      formModel.pairings.minItems,
      `${formModel.pairings.label}을 최소 ${formModel.pairings.minItems}개 이상 추가해주세요.`
    )
    .max(
      formModel.pairings.maxItems,
      `${formModel.pairings.label}은 최대 ${formModel.pairings.maxItems}개까지 추가할 수 있습니다.`
    );
}

export function createDefaultWhiskyCurationFormState(
  _formModel: WhiskyCurationFormModel
): WhiskyCurationFormState {
  return {
    name: '',
    description: '',
    imageUrls: [],
    exposureStartDate: '',
    exposureEndDate: '',
    displayOrder: 0,
    isActive: true,
    alcohols: [],
  };
}

export function createEmptyWhiskyMirror(): CurationWhiskyMirror {
  return {
    alcoholId: null,
    korName: '',
    engName: '',
    imageUrl: '',
    abv: '',
    cask: '',
    volume: '',
    regionName: '',
    korCategory: '',
    selectedTags: [],
  };
}

export function createEmptyWhiskyCurationItem(
  formModel: WhiskyCurationFormModel
): WhiskyCurationItemFormState {
  return {
    source: 'MANUAL',
    alcohol: createEmptyWhiskyMirror(),
    stats: null,
    comment: '',
    pairings: createDefaultPairings(formModel),
  };
}

export function createDefaultPairings(formModel: WhiskyCurationFormModel): PairingFoodValue[] {
  return formModel.pairings
    ? Array.from({ length: formModel.pairings.minItems }, () => createEmptyPairingFood())
    : [];
}

export function createEmptyPairingFood(): PairingFoodValue {
  return {
    itemName: '',
    pairingNote: '',
    itemImageUrl: '',
  };
}
