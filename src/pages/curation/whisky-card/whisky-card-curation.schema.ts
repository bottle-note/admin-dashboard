import { z } from 'zod';

import type { CurationV2Spec } from '@/types/api';

import type {
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
  CurationWhiskySource,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import { getSchemaProperty, isSchemaPropertyRequired } from '../curation-form-model';

export interface PairingFoodValue {
  itemName: string;
  pairingNote: string;
  itemImageUrl?: string;
}

export interface WhiskyCardCurationFormState {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
  source: CurationWhiskySource;
  alcohol: CurationWhiskyMirror;
  stats?: CurationWhiskyStats | null;
  comment: string;
  pairings: PairingFoodValue[];
  [key: string]: unknown;
}

export interface WhiskyCardCurationFormModel {
  spec: CurationV2Spec;
  title: string;
  editTitle: string;
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
  const selectedTagsSchema = getSchemaProperty(alcoholSchema, 'selectedTags');
  const commentSchema = spec.requestSpec.properties?.comment;
  const pairingsSchema = spec.requestSpec.properties?.pairings;
  const pairingItemSchema = pairingsSchema?.items;
  const pairingItemProperties = pairingItemSchema?.properties ?? {};

  return {
    spec,
    title: `${spec.name} 작성`,
    editTitle: `${spec.name} 수정`,
    whiskyLabel: String(alcoholSchema['x-display-name'] ?? '위스키'),
    commentLabel: String(commentSchema?.['x-display-name'] ?? '큐레이터 코멘트'),
    commentRequired: isSchemaPropertyRequired(spec.requestSpec, 'comment'),
    commentMaxLength: commentSchema?.maxLength ?? 500,
    selectedTags: {
      label: String(selectedTagsSchema['x-display-name'] ?? '테이스팅 태그'),
      required: isSchemaPropertyRequired(alcoholSchema, 'selectedTags'),
      minItems: selectedTagsSchema.minItems ?? 1,
      maxItems: selectedTagsSchema.maxItems ?? 12,
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

export function createCurationWhiskyCardFormSchema(
  formModel: WhiskyCardCurationFormModel,
  options: { mode?: 'create' | 'edit' } = {}
): z.ZodType<WhiskyCardCurationFormState> {
  const isEditMode = options.mode === 'edit';
  const pairingsSchema = formModel.pairings
    ? z
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
        )
    : z.array(z.never()).optional();

  const commentSchema = z
    .string()
    .max(
      formModel.commentMaxLength,
      `${formModel.commentLabel}는 최대 ${formModel.commentMaxLength}자까지 입력할 수 있습니다.`
    );

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
    comment: formModel.commentRequired
      ? commentSchema.min(1, `${formModel.commentLabel}은 필수입니다.`)
      : commentSchema,
    pairings: pairingsSchema,
  }) as unknown as z.ZodType<WhiskyCardCurationFormState>;
}

export function createDefaultWhiskyCardCurationFormState(
  formModel: WhiskyCardCurationFormModel
): WhiskyCardCurationFormState {
  return {
    name: '',
    description: '',
    imageUrls: [],
    exposureStartDate: '',
    exposureEndDate: '',
    displayOrder: 0,
    isActive: true,
    source: 'MANUAL',
    alcohol: createEmptyWhiskyMirror(),
    stats: null,
    comment: '',
    pairings: formModel.pairings
      ? Array.from({ length: formModel.pairings.minItems }, () => createEmptyPairingFood())
      : [],
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

export function createEmptyPairingFood(): PairingFoodValue {
  return {
    itemName: '',
    pairingNote: '',
    itemImageUrl: '',
  };
}

export function toWhiskyCardValue(values: WhiskyCardCurationFormState): CurationWhiskyCardValue {
  return {
    source: values.source,
    alcohol: values.alcohol,
    stats: values.stats,
    comment: values.comment,
  };
}
