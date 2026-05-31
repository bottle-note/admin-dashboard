import type { CurationV2Spec, JsonSchemaNode } from '@/types/api';

export interface TastingEventFieldContract {
  label: string;
  required: boolean;
}

export interface TastingEventTextFieldContract extends TastingEventFieldContract {
  maxLength: number;
}

export interface TastingEventNumberFieldContract extends TastingEventFieldContract {
  minimum: number;
  maximum?: number;
}

export interface TastingEventCapacityFieldContract extends TastingEventNumberFieldContract {
  maximum: number;
}

export interface TastingEventAlcoholsContract extends TastingEventFieldContract {
  minItems: number;
  maxItems: number;
  selectedTags: TastingEventFieldContract & {
    minItems: number;
    maxItems: number;
  };
  comment: TastingEventFieldContract & {
    maxLength: number;
  };
}

export interface TastingEventFormContract {
  eventDate: TastingEventFieldContract;
  eventTime: TastingEventFieldContract;
  barAddress: TastingEventTextFieldContract;
  detailAddress: TastingEventTextFieldContract;
  isRecruiting: TastingEventFieldContract;
  entryFee: TastingEventNumberFieldContract;
  capacity: TastingEventCapacityFieldContract;
  applicationLink: TastingEventTextFieldContract;
  guideText: TastingEventTextFieldContract;
  alcohols: TastingEventAlcoholsContract;
}

export const INITIAL_TASTING_EVENT_FORM_CONTRACT: TastingEventFormContract = {
  eventDate: { label: '시음회 날짜', required: true },
  eventTime: { label: '시음회 시간', required: true },
  barAddress: { label: '장소 및 바 주소', required: true, maxLength: 200 },
  detailAddress: { label: '상세 주소', required: true, maxLength: 200 },
  isRecruiting: { label: '시음회 참여자를 모집할 목적이신가요?', required: false },
  entryFee: { label: '참가비', required: true, minimum: 0 },
  capacity: { label: '총 모집 인원수', required: true, minimum: 1, maximum: 999 },
  applicationLink: { label: '신청링크', required: true, maxLength: 2048 },
  guideText: { label: '안내사항', required: true, maxLength: 1000 },
  alcohols: {
    label: '시음 위스키',
    required: true,
    minItems: 1,
    maxItems: 10,
    selectedTags: {
      label: '테이스팅 태그',
      required: true,
      minItems: 1,
      maxItems: 12,
    },
    comment: {
      label: '위스키 기대평',
      required: false,
      maxLength: 500,
    },
  },
};

function getProperties(schema: JsonSchemaNode): Record<string, JsonSchemaNode> {
  return schema.properties!;
}

function getProperty(schema: JsonSchemaNode, key: string): JsonSchemaNode {
  return getProperties(schema)[key]!;
}

function isRequired(schema: JsonSchemaNode, key: string): boolean {
  return schema.required?.includes(key) ?? false;
}

function getDisplayName(schema: JsonSchemaNode): string {
  const displayName = schema['x-display-name'];
  if (typeof displayName === 'string') return displayName;

  return schema.description ?? schema.title!;
}

function createFieldContract(
  rootSchema: JsonSchemaNode,
  key: string,
  options: { label?: string } = {}
): TastingEventFieldContract {
  const fieldSchema = getProperty(rootSchema, key);

  return {
    label: options.label ?? getDisplayName(fieldSchema),
    required: isRequired(rootSchema, key),
  };
}

function createTextFieldContract(
  rootSchema: JsonSchemaNode,
  key: string
): TastingEventTextFieldContract {
  const fieldSchema = getProperty(rootSchema, key);

  return {
    ...createFieldContract(rootSchema, key),
    maxLength: fieldSchema.maxLength!,
  };
}

function createNumberFieldContract(
  rootSchema: JsonSchemaNode,
  key: string
): TastingEventNumberFieldContract {
  const fieldSchema = getProperty(rootSchema, key);

  return {
    ...createFieldContract(rootSchema, key),
    minimum: fieldSchema.minimum!,
    maximum: fieldSchema.maximum,
  };
}

export function createTastingEventFormContract(spec: CurationV2Spec): TastingEventFormContract {
  const rootSchema = spec.requestSpec;
  const alcoholsSchema = getProperty(rootSchema, 'alcohols');
  const alcoholItemSchema = alcoholsSchema.items!;
  const alcoholSchema = getProperty(alcoholItemSchema, 'alcohol');
  const selectedTagsSchema = getProperty(alcoholSchema, 'selectedTags');
  const commentSchema = getProperty(alcoholItemSchema, 'comment');
  const capacityContract = createNumberFieldContract(rootSchema, 'capacity');

  return {
    eventDate: createFieldContract(rootSchema, 'eventDate'),
    eventTime: createFieldContract(rootSchema, 'eventTime'),
    barAddress: createTextFieldContract(rootSchema, 'barAddress'),
    detailAddress: createTextFieldContract(rootSchema, 'detailAddress'),
    isRecruiting: createFieldContract(rootSchema, 'isRecruiting', {
      label: '시음회 참여자를 모집할 목적이신가요?',
    }),
    entryFee: createNumberFieldContract(rootSchema, 'entryFee'),
    capacity: {
      ...capacityContract,
      maximum: capacityContract.maximum!,
    },
    applicationLink: createTextFieldContract(rootSchema, 'applicationLink'),
    guideText: createTextFieldContract(rootSchema, 'guideText'),
    alcohols: {
      label: getDisplayName(alcoholsSchema),
      required: isRequired(rootSchema, 'alcohols'),
      minItems: alcoholsSchema.minItems!,
      maxItems: alcoholsSchema.maxItems!,
      selectedTags: {
        label: getDisplayName(selectedTagsSchema),
        required: isRequired(alcoholSchema, 'selectedTags'),
        minItems: selectedTagsSchema.minItems ?? 1,
        maxItems: selectedTagsSchema.maxItems!,
      },
      comment: {
        label: getDisplayName(commentSchema),
        required: isRequired(alcoholItemSchema, 'comment'),
        maxLength: commentSchema.maxLength!,
      },
    },
  };
}
