import type { CurationV2Spec } from '@/types/api';

import type {
  CurationBooleanRadioFieldModel,
  CurationBasicFieldModel,
  CurationFieldModelBuildContext,
  CurationFieldModel,
  CurationFormModel,
  CurationFormSectionModel,
  CurationTextFieldModel,
} from '../curation-form-model';
import {
  createCurationFormModelFromRequestSpec,
  getSchemaDisplayLabel,
  getSchemaProperty,
  isSchemaPropertyRequired,
} from '../curation-form-model';
import type { CurationWhiskyCardListFieldModel } from '../curation-whisky-card-list.types';

const DATE_LOCATION_FIELD_KEYS = [
  'eventDate',
  'eventTime',
  'barAddress',
  'detailAddress',
  'placeName',
];

const TASTING_EVENT_PLACE_NAME_FIELD: CurationTextFieldModel = {
  key: 'placeName',
  label: '장소명',
  required: false,
  kind: 'text',
  description: '시음회 장소명',
  placeholder: '예: 도시남 바',
  maxLength: 100,
};

export type TastingEventFormModel = CurationFormModel;

// 시음회 스펙을 자동 렌더링 파이프라인의 form model로 변환합니다.
export function createTastingEventFormModel(spec: CurationV2Spec): TastingEventFormModel {
  // 1. requestSpec 레이어: 상세 스펙의 requestSpec을 화면 생성의 단일 입력으로 사용합니다.
  const formModel = createCurationFormModelFromRequestSpec(spec.requestSpec, {
    // 2. schema parser 레이어: 공통 parser가 JSON Schema와 x-* 메타데이터를 읽습니다.
    // 3. form/field model 레이어: 공통 필드는 기본 field model로, 특수 필드는 도메인 field model로 만듭니다.
    createCustomField: createTastingEventCustomFieldModel,
    overrideField: applyTastingEventFieldOverrides,
    // 5. form renderer 준비 레이어: 화면 렌더러가 순회할 섹션 배치를 만듭니다.
    createSections: createTastingEventFormSections,
  });

  const payloadFields = insertTastingEventPlaceNameField(formModel.payloadFields);

  return {
    ...formModel,
    payloadFields,
    sections: createTastingEventFormSections(payloadFields),
  };
}

// 시음회에서 공통 field model로 표현할 수 없는 특수 필드를 도메인 field model로 변환합니다.
function createTastingEventCustomFieldModel({
  requestSpec,
  key,
  kind,
}: CurationFieldModelBuildContext): CurationFieldModel | null {
  if (kind !== 'alcohol-card-list') return null;

  return createTastingEventAlcoholsFieldModel(requestSpec, key);
}

// 시음회 위스키 배열 schema를 위스키 카드 리스트 field model로 변환합니다.
function createTastingEventAlcoholsFieldModel(
  requestSpec: CurationV2Spec['requestSpec'],
  key: string
): CurationWhiskyCardListFieldModel {
  const alcoholsSchema = getSchemaProperty(requestSpec, key);
  const alcoholItemSchema = alcoholsSchema.items!;
  const alcoholSchema = getSchemaProperty(alcoholItemSchema, 'alcohol');
  const selectedTagsSchema = getSchemaProperty(alcoholSchema, 'selectedTags');
  const commentSchema = getSchemaProperty(alcoholItemSchema, 'comment');

  return {
    key,
    kind: 'alcohol-card-list',
    label: getSchemaDisplayLabel(alcoholsSchema),
    required: isSchemaPropertyRequired(requestSpec, key),
    minItems: alcoholsSchema.minItems!,
    maxItems: alcoholsSchema.maxItems!,
    selectedTags: {
      label: getSchemaDisplayLabel(selectedTagsSchema),
      required: isSchemaPropertyRequired(alcoholSchema, 'selectedTags'),
      minItems: selectedTagsSchema.minItems ?? 1,
      maxItems: selectedTagsSchema.maxItems!,
    },
    comment: {
      label: getSchemaDisplayLabel(commentSchema),
      required: isSchemaPropertyRequired(alcoholItemSchema, 'comment'),
      maxLength: commentSchema.maxLength!,
    },
  };
}

// 공통 field model에 시음회 화면에서 필요한 라벨, placeholder, 단위 override를 적용합니다.
function applyTastingEventFieldOverrides(field: CurationBasicFieldModel): CurationBasicFieldModel {
  switch (field.key) {
    case 'eventTime':
      return field.kind === 'text' || field.kind === 'time'
        ? ({ ...field, kind: 'time' } satisfies CurationTextFieldModel)
        : field;
    case 'barAddress':
      return field.kind === 'text'
        ? ({
            ...field,
            kind: 'address',
            placeholder: '장소명을 검색해 선택하세요.',
          } satisfies CurationTextFieldModel)
        : field;
    case 'detailAddress':
      return field.kind === 'text' ? { ...field, placeholder: '예: 2층 안쪽 입구' } : field;
    case 'isRecruiting':
      return field.kind === 'boolean-radio'
        ? ({
            ...field,
            label: '시음회 참여자를 모집할 목적이신가요?',
            trueLabel: '네',
            falseLabel: '아니요, 광고만 하겠습니다.',
            defaultValue: true,
          } satisfies CurationBooleanRadioFieldModel)
        : field;
    case 'entryFee':
      return field.kind === 'number' ? { ...field, suffix: '원' } : field;
    case 'capacity':
      return field.kind === 'number' ? { ...field, suffix: '명' } : field;
    case 'applicationLink':
      return field.kind === 'text'
        ? { ...field, placeholder: 'https://forms.example.com/tasting' }
        : field;
    case 'guideText':
      return field.kind === 'textarea'
        ? { ...field, placeholder: '시작 10분 전 입장해 주세요.' }
        : field;
    default:
      return field;
  }
}

function insertTastingEventPlaceNameField(fields: CurationFieldModel[]): CurationFieldModel[] {
  if (fields.some((field) => field.key === TASTING_EVENT_PLACE_NAME_FIELD.key)) {
    return fields;
  }

  const detailAddressIndex = fields.findIndex((field) => field.key === 'detailAddress');
  if (detailAddressIndex < 0) {
    return [...fields, TASTING_EVENT_PLACE_NAME_FIELD];
  }

  return [
    ...fields.slice(0, detailAddressIndex + 1),
    TASTING_EVENT_PLACE_NAME_FIELD,
    ...fields.slice(detailAddressIndex + 1),
  ];
}

// payload 필드 목록을 시음회 화면의 날짜/참가/위스키 섹션으로 배치합니다.
function createTastingEventFormSections(fields: CurationFieldModel[]): CurationFormSectionModel[] {
  const dateLocationFields = fields.filter((field) => DATE_LOCATION_FIELD_KEYS.includes(field.key));
  const alcoholLineupFields = fields.filter((field) => field.kind === 'alcohol-card-list');
  const participationFields = fields.filter(
    (field) => !DATE_LOCATION_FIELD_KEYS.includes(field.key) && field.kind !== 'alcohol-card-list'
  );

  return [
    {
      id: 'dateLocation',
      title: '날짜 및 장소',
      stepNumber: 2,
      description: '날짜 및 장소를 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: dateLocationFields.map((field) => ({
        field,
        className:
          field.key === 'barAddress' || field.key === 'detailAddress' ? 'md:col-span-2' : undefined,
      })),
    },
    {
      id: 'participation',
      title: '참가 정보',
      stepNumber: 3,
      description: '참가비, 인원수, 안내사항 등을 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: participationFields.map((field) => ({
        field,
        className: getTastingEventParticipationFieldClassName(field),
        visibleWhen:
          field.key === 'applicationLink'
            ? { fieldKey: 'isRecruiting', equals: true, hiddenValue: '' }
            : undefined,
      })),
    },
    {
      id: 'alcoholLineup',
      title: '시음 위스키',
      stepNumber: 4,
      description: '시음회에 사용될 위스키를 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: alcoholLineupFields.map((field) => ({ field })),
    },
  ];
}

// 참가 정보 섹션에서 필드 타입별 grid span을 결정합니다.
function getTastingEventParticipationFieldClassName(field: CurationFieldModel): string | undefined {
  if (field.kind === 'number') return undefined;

  return 'md:col-span-2';
}
