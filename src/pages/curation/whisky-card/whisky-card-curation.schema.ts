import { z } from 'zod';

import type { CurationV2Spec, JsonSchemaNode } from '@/types/api';

import type {
  CurationWhiskyCardListFormValues,
  CurationWhiskyCardListFieldModel,
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
} from '../curation-whisky-card-list.types';
import type {
  CurationFieldModel,
  CurationFormModel,
  CurationFormSectionModel,
} from '../curation-form-model';
import {
  createCurationFormModelFromRequestSpec,
  getSchemaDisplayLabel,
  getSchemaProperty,
  isSchemaPropertyRequired,
} from '../curation-form-model';

export interface PairingFoodValue {
  itemName: string;
  pairingNote: string;
  itemImageUrl?: string;
}

export interface WhiskyCardCurationItemFormState extends CurationWhiskyCardValue {
  pairings: PairingFoodValue[];
}

export interface WhiskyCardCurationFormState extends CurationWhiskyCardListFormValues {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
  alcohols: WhiskyCardCurationItemFormState[];
}

export interface WhiskyCardCurationFormModel extends CurationFormModel {
  spec: CurationV2Spec;
  title: string;
  editTitle: string;
  alcoholsField: CurationWhiskyCardListFieldModel;
  whiskyLabel: string;
  commentLabel: string;
  commentRequired: boolean;
  commentMaxLength: number;
  selectedTags: {
    label: string;
    required: boolean;
    minItems: number;
    maxItems: number;
  };
  items: {
    label: string;
    minItems: number;
    maxItems: number;
  };
  pairings?: {
    label: string;
    minItems: number;
    maxItems: number;
    itemNameLabel: string;
    itemNameMaxLength: number;
    pairingNoteLabel: string;
    pairingNoteMaxLength: number;
    itemImageUrlLabel: string;
  };
}

export function createWhiskyCardCurationFormModel(
  spec: CurationV2Spec
): WhiskyCardCurationFormModel {
  const alcoholSchema = getSchemaProperty(spec.requestSpec, 'alcohol');
  const commentSchema = spec.requestSpec.properties?.comment;
  const pairingsSchema = spec.requestSpec.properties?.pairings;
  const pairingItemSchema = pairingsSchema?.items;
  const pairingItemProperties = pairingItemSchema?.properties ?? {};
  const curationWhiskyLabel = String(alcoholSchema['x-display-name'] ?? spec.name);
  const formRequestSpec = createWhiskyCardListRequestSpec(spec, curationWhiskyLabel);
  const baseFormModel = createCurationFormModelFromRequestSpec(formRequestSpec, {
    createCustomField: createWhiskyCardCustomFieldModel,
    createSections: createWhiskyCardFormSections,
  });
  const alcoholsField = baseFormModel.payloadFields.find(
    (field): field is CurationWhiskyCardListFieldModel => field.kind === 'alcohol-card-list'
  );

  if (!alcoholsField) {
    throw new Error('추천/페어링 큐레이션 스펙에 위스키 카드 리스트 필드를 만들 수 없습니다.');
  }

  return {
    ...baseFormModel,
    spec,
    title: `${spec.name} 작성`,
    editTitle: `${spec.name} 수정`,
    alcoholsField,
    whiskyLabel: alcoholsField.label,
    commentLabel: String(commentSchema?.['x-display-name'] ?? '큐레이터 코멘트'),
    commentRequired: isSchemaPropertyRequired(spec.requestSpec, 'comment'),
    commentMaxLength: commentSchema?.maxLength ?? 500,
    selectedTags: alcoholsField.selectedTags,
    items: {
      label: alcoholsField.label,
      minItems: alcoholsField.minItems,
      maxItems: alcoholsField.maxItems,
    },
    pairings: pairingsSchema
      ? {
          label: String(pairingsSchema['x-display-name'] ?? '페어링 음식'),
          minItems: pairingsSchema.minItems ?? 0,
          maxItems: pairingsSchema.maxItems ?? 5,
          itemNameLabel: String(pairingItemProperties.itemName?.['x-display-name'] ?? '음식명'),
          itemNameMaxLength: pairingItemProperties.itemName?.maxLength ?? 100,
          pairingNoteLabel: String(
            pairingItemProperties.pairingNote?.['x-display-name'] ?? '페어링 설명'
          ),
          pairingNoteMaxLength: pairingItemProperties.pairingNote?.maxLength ?? 500,
          itemImageUrlLabel: String(
            pairingItemProperties.itemImageUrl?.['x-display-name'] ?? '음식 이미지'
          ),
        }
      : undefined,
  };
}

function createWhiskyCardListRequestSpec(
  spec: CurationV2Spec,
  label: string
): CurationV2Spec['requestSpec'] {
  return {
    type: 'object',
    required: ['alcohols'],
    properties: {
      alcohols: {
        type: 'array',
        minItems: spec.requestSpec.minItems ?? 1,
        maxItems: spec.requestSpec.maxItems ?? 10,
        'x-field-style': 'alcohol-card-list',
        'x-display-name': label,
        items: spec.requestSpec,
      },
    },
  };
}

function createWhiskyCardCustomFieldModel({
  requestSpec,
  key,
  kind,
}: {
  requestSpec: JsonSchemaNode;
  key: string;
  kind: CurationFieldModel['kind'];
}): CurationFieldModel | null {
  if (kind !== 'alcohol-card-list') return null;

  return createWhiskyCardAlcoholsFieldModel(requestSpec, key);
}

function createWhiskyCardAlcoholsFieldModel(
  requestSpec: JsonSchemaNode,
  key: string
): CurationWhiskyCardListFieldModel {
  const alcoholsSchema = getSchemaProperty(requestSpec, key);
  const alcoholItemSchema = alcoholsSchema.items!;
  const alcoholSchema = getSchemaProperty(alcoholItemSchema, 'alcohol');
  const selectedTagsSchema = getSchemaProperty(alcoholSchema, 'selectedTags');
  const commentSchema = alcoholItemSchema.properties?.comment;

  return {
    key,
    kind: 'alcohol-card-list',
    label: getSchemaDisplayLabel(alcoholsSchema),
    required: isSchemaPropertyRequired(requestSpec, key),
    minItems: alcoholsSchema.minItems ?? 1,
    maxItems: alcoholsSchema.maxItems ?? 10,
    selectedTags: {
      label: getSchemaDisplayLabel(selectedTagsSchema) || '테이스팅 태그',
      required: isSchemaPropertyRequired(alcoholSchema, 'selectedTags'),
      minItems: selectedTagsSchema.minItems ?? 1,
      maxItems: selectedTagsSchema.maxItems ?? 12,
    },
    comment: {
      label: commentSchema ? getSchemaDisplayLabel(commentSchema) : '큐레이터 코멘트',
      required: isSchemaPropertyRequired(alcoholItemSchema, 'comment'),
      maxLength: commentSchema?.maxLength ?? 500,
    },
  };
}

function createWhiskyCardFormSections(fields: CurationFieldModel[]): CurationFormSectionModel[] {
  const alcoholFields = fields.filter((field) => field.kind === 'alcohol-card-list');

  return [
    {
      id: 'whiskyCards',
      title: alcoholFields[0]?.label ?? '위스키',
      stepNumber: 2,
      description: '큐레이션에 노출할 위스키를 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: alcoholFields.map((field) => ({ field })),
    },
  ];
}

export function createCurationWhiskyCardFormSchema(
  formModel: WhiskyCardCurationFormModel,
  options: { mode?: 'create' | 'edit' } = {}
): z.ZodType<WhiskyCardCurationFormState> {
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
        .array(z.string().min(1, `${formModel.selectedTags.label}를 입력해주세요.`))
        .min(
          formModel.selectedTags.minItems,
          `${formModel.selectedTags.label}를 최소 ${formModel.selectedTags.minItems}개 이상 추가해주세요.`
        )
        .max(
          formModel.selectedTags.maxItems,
          `${formModel.selectedTags.label}는 최대 ${formModel.selectedTags.maxItems}개까지 추가할 수 있습니다.`
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

  return z.object({
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
    alcohols: z
      .array(curationItemSchema)
      .min(
        formModel.items.minItems,
        `${formModel.whiskyLabel}를 최소 ${formModel.items.minItems}개 이상 추가해주세요.`
      )
      .max(
        formModel.items.maxItems,
        `${formModel.whiskyLabel}는 최대 ${formModel.items.maxItems}개까지 추가할 수 있습니다.`
      ),
  }) as unknown as z.ZodType<WhiskyCardCurationFormState>;
}

function createCommentSchema(formModel: WhiskyCardCurationFormModel) {
  const commentSchema = z
    .string()
    .max(
      formModel.commentMaxLength,
      `${formModel.commentLabel}는 최대 ${formModel.commentMaxLength}자까지 입력할 수 있습니다.`
    );

  return formModel.commentRequired
    ? commentSchema.min(1, `${formModel.commentLabel}은 필수입니다.`)
    : commentSchema;
}

function createPairingsSchema(formModel: WhiskyCardCurationFormModel) {
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

export function createDefaultWhiskyCardCurationFormState(
  _formModel: WhiskyCardCurationFormModel
): WhiskyCardCurationFormState {
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

export function createEmptyWhiskyCardCurationItem(
  formModel: WhiskyCardCurationFormModel
): WhiskyCardCurationItemFormState {
  return {
    source: 'MANUAL',
    alcohol: createEmptyWhiskyMirror(),
    stats: null,
    comment: '',
    pairings: createDefaultPairings(formModel),
  };
}

export function createDefaultPairings(formModel: WhiskyCardCurationFormModel): PairingFoodValue[] {
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
