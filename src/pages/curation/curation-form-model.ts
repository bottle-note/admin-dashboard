import type { JsonSchemaNode } from '@/types/api';

import type { CurationWhiskyCardListFieldModel } from './curation-whisky-card-list.types';

export type CurationFieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'address'
  | 'hidden'
  | 'number'
  | 'boolean-radio'
  | 'select'
  | 'multi-select'
  | 'alcohol-card-list'
  | 'object-array';

export interface CurationBaseFieldModel {
  key: string;
  label: string;
  required: boolean;
  kind: CurationFieldKind;
  description?: string;
  fieldStyle?: string;
  placeholder?: string;
  defaultValue?: unknown;
  nullable?: boolean;
  ariaLabel?: string;
}

export interface CurationTextFieldModel extends CurationBaseFieldModel {
  kind: 'text' | 'textarea' | 'date' | 'time' | 'address' | 'hidden';
  minLength?: number;
  maxLength?: number;
}

export interface CurationNumberFieldModel extends CurationBaseFieldModel {
  kind: 'number';
  numberType: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  suffix?: string;
  undecidedOption?: {
    label: string;
    value: number;
    fallbackValue: number;
  };
  linkedCheckbox?: {
    label: string;
    fieldKey: string;
    valueWhenChecked: number;
    valueWhenUnchecked: number;
  };
}

export interface CurationBooleanRadioFieldModel extends CurationBaseFieldModel {
  kind: 'boolean-radio';
  trueLabel: string;
  falseLabel: string;
}

export interface CurationSelectOption {
  value: string;
  label: string;
}

export interface CurationSelectFieldModel extends CurationBaseFieldModel {
  kind: 'select';
  options: CurationSelectOption[];
}

export interface CurationMultiSelectFieldModel extends CurationBaseFieldModel {
  kind: 'multi-select';
  options: CurationSelectOption[];
  minItems: number;
  maxItems?: number;
}

export type CurationBasicFieldModel =
  | CurationTextFieldModel
  | CurationNumberFieldModel
  | CurationBooleanRadioFieldModel
  | CurationSelectFieldModel
  | CurationMultiSelectFieldModel;

export interface CurationObjectArrayFieldModel extends CurationBaseFieldModel {
  kind: 'object-array';
  minItems: number;
  maxItems?: number;
  itemFields: CurationFieldModel[];
}

export type CurationFieldModel =
  | CurationBasicFieldModel
  | CurationWhiskyCardListFieldModel
  | CurationObjectArrayFieldModel;

export interface CurationFieldVisibilityCondition {
  fieldKey: string;
  equals: unknown;
  hiddenValue?: unknown;
}

export interface CurationSectionFieldModel {
  field: CurationFieldModel;
  className?: string;
  visibleWhen?: CurationFieldVisibilityCondition;
}

export interface CurationFormSectionModel {
  id: string;
  title: string;
  stepNumber?: number;
  description?: string;
  contentClassName?: string;
  fields: CurationSectionFieldModel[];
}

export interface CurationFormModel {
  payloadFields: CurationFieldModel[];
  sections: CurationFormSectionModel[];
}

export interface CurationFieldModelBuildContext {
  requestSpec: JsonSchemaNode;
  fieldSchema: JsonSchemaNode;
  key: string;
  kind: CurationFieldKind;
}

export interface CreateCurationFormModelOptions {
  createCustomField?: (context: CurationFieldModelBuildContext) => CurationFieldModel | null;
  overrideField?: (field: CurationBasicFieldModel) => CurationBasicFieldModel;
  createSections: (payloadFields: CurationFieldModel[]) => CurationFormSectionModel[];
}

// requestSpec을 화면 렌더링에 필요한 field/section model로 변환합니다.
export function createCurationFormModelFromRequestSpec(
  requestSpec: JsonSchemaNode,
  options: CreateCurationFormModelOptions
): CurationFormModel {
  const payloadFields = Object.keys(getSchemaProperties(requestSpec)).map((key) =>
    createCurationFieldModel(requestSpec, key, options)
  );

  return {
    payloadFields,
    sections: options.createSections(payloadFields),
  };
}

function createCurationFieldModel(
  requestSpec: JsonSchemaNode,
  key: string,
  options: Pick<CreateCurationFormModelOptions, 'createCustomField' | 'overrideField'> = {}
): CurationFieldModel {
  const fieldSchema = getSchemaProperty(requestSpec, key);
  const kind = getSchemaFieldKind(key, fieldSchema);
  const customField = options.createCustomField?.({ requestSpec, fieldSchema, key, kind });

  if (customField) {
    return customField;
  }

  if (kind === 'alcohol-card-list') {
    if (!fieldSchema.items) {
      throw new Error(`지원하지 않는 큐레이션 스키마 필드: ${key}의 items가 없습니다.`);
    }

    return createAlcoholCardListFieldModel({
      key,
      label: getSchemaDisplayLabel(fieldSchema),
      required: isSchemaPropertyRequired(requestSpec, key),
      minItems: fieldSchema.minItems ?? (isSchemaPropertyRequired(requestSpec, key) ? 1 : 0),
      maxItems: typeof fieldSchema.maxItems === 'number' ? fieldSchema.maxItems : undefined,
      itemSchema: fieldSchema.items,
    });
  }

  if (kind === 'object-array') {
    const itemSchema = fieldSchema.items;
    if (!itemSchema || itemSchema.type !== 'object') {
      throw new Error(`지원하지 않는 큐레이션 스키마 필드: ${key}의 object items가 없습니다.`);
    }

    return {
      key,
      kind,
      label: getSchemaDisplayLabel(fieldSchema) || key,
      required: isSchemaPropertyRequired(requestSpec, key),
      nullable: fieldSchema.nullable,
      minItems: fieldSchema.minItems ?? 0,
      maxItems: typeof fieldSchema.maxItems === 'number' ? fieldSchema.maxItems : undefined,
      itemFields: Object.keys(getSchemaProperties(itemSchema)).map((itemKey) =>
        createCurationFieldModel(itemSchema, itemKey)
      ),
    };
  }

  const basicField = createCurationBasicFieldModel(requestSpec, key);
  return options.overrideField?.(basicField) ?? basicField;
}

export function getSchemaProperties(schema: JsonSchemaNode): Record<string, JsonSchemaNode> {
  return schema.properties ?? {};
}

export function getSchemaProperty(schema: JsonSchemaNode, key: string): JsonSchemaNode {
  const property = getSchemaProperties(schema)[key];
  if (!property) {
    throw new Error(`requestSpec에 ${key} 필드가 없습니다.`);
  }

  return property;
}

export function isSchemaPropertyRequired(schema: JsonSchemaNode, key: string): boolean {
  return schema.required?.includes(key) ?? false;
}

export function getSchemaXString(schema: JsonSchemaNode, key: `x-${string}`): string | undefined {
  const value = schema[key];
  return typeof value === 'string' ? value : undefined;
}

export function getSchemaDisplayLabel(schema: JsonSchemaNode): string {
  return getSchemaXString(schema, 'x-display-name') ?? schema.description ?? schema.title ?? '';
}

export function getSchemaFieldStyle(schema: JsonSchemaNode): string | undefined {
  return getSchemaXString(schema, 'x-field-style');
}

export function getSchemaPlaceholder(schema: JsonSchemaNode): string | undefined {
  return getSchemaXString(schema, 'x-placeholder');
}

export function getSchemaFieldKind(key: string, schema: JsonSchemaNode): CurationFieldKind {
  return resolveSchemaKind(key, schema, getSchemaFieldStyle(schema));
}

// schema 타입과 x-field-style을 기준으로 기본 field kind를 결정합니다.
function resolveSchemaKind(
  key: string,
  schema: JsonSchemaNode,
  fieldStyle?: string
): CurationFieldKind {
  if (fieldStyle === 'address-search' && key.toLowerCase().endsWith('placeid')) return 'hidden';
  if (fieldStyle === 'long-text') return 'textarea';
  if (fieldStyle === 'plain-text') return 'text';
  if (fieldStyle === 'address-search') return 'address';
  if (fieldStyle === 'hidden') return 'hidden';
  if (fieldStyle === 'alcohol-card-list') return 'alcohol-card-list';
  if (fieldStyle === 'time') return 'time';
  if (fieldStyle === 'date') return 'date';
  if (schema.format === 'date') return 'date';
  if (schema.format === 'time') return 'time';
  if (key.toLowerCase().includes('time')) return 'time';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean-radio';
  if (schema.type === 'array' && schema.items?.enum) return 'multi-select';
  if (schema.type === 'array' && schema.items?.type === 'object') return 'object-array';
  if (schema.type === 'array') {
    throw new Error(`지원하지 않는 큐레이션 스키마 필드: ${key} 배열 형식`);
  }
  if (schema.type === 'object') {
    throw new Error(`지원하지 않는 큐레이션 스키마 필드: ${key} 객체 형식`);
  }
  if (schema.enum) return 'select';
  if (schema.maxLength && schema.maxLength > 500) return 'textarea';

  return 'text';
}

// requestSpec의 단일 필드를 화면 렌더링용 기본 field model로 변환합니다.
export function createCurationBasicFieldModel(
  requestSpec: JsonSchemaNode,
  key: string
): CurationBasicFieldModel {
  const fieldSchema = getSchemaProperty(requestSpec, key);
  const base = {
    key,
    label: getSchemaDisplayLabel(fieldSchema),
    required: isSchemaPropertyRequired(requestSpec, key),
    description: fieldSchema.description,
    fieldStyle: getSchemaFieldStyle(fieldSchema),
    placeholder: getSchemaPlaceholder(fieldSchema),
    defaultValue: fieldSchema.default,
    nullable: fieldSchema.nullable,
  };
  const kind = getSchemaFieldKind(key, fieldSchema);

  switch (kind) {
    case 'number':
      return {
        ...base,
        kind,
        numberType: fieldSchema.type === 'integer' ? 'integer' : 'number',
        minimum: fieldSchema.minimum,
        maximum: fieldSchema.maximum,
      };
    case 'boolean-radio':
      return {
        ...base,
        kind,
        trueLabel: '네',
        falseLabel: '아니요',
      };
    case 'select':
      return {
        ...base,
        kind,
        options: createEnumOptions(key, fieldSchema.enum),
      };
    case 'multi-select':
      return {
        ...base,
        kind,
        options: createEnumOptions(key, fieldSchema.items?.enum),
        minItems: fieldSchema.minItems ?? 0,
        maxItems: typeof fieldSchema.maxItems === 'number' ? fieldSchema.maxItems : undefined,
      };
    case 'textarea':
    case 'date':
    case 'time':
    case 'address':
    case 'hidden':
    case 'text':
      return {
        ...base,
        kind,
        minLength: fieldSchema.minLength,
        maxLength: fieldSchema.maxLength,
      };
    case 'alcohol-card-list':
      throw new Error('alcohol-card-list는 createAlcoholCardListFieldModel로 생성해야 합니다.');
    case 'object-array':
      throw new Error('object-array는 createCurationFieldModel로 생성해야 합니다.');
  }
}

function createEnumOptions(
  key: string,
  enumValues: JsonSchemaNode['enum']
): CurationSelectOption[] {
  if (!enumValues || enumValues.some((value) => typeof value !== 'string')) {
    throw new Error(`지원하지 않는 큐레이션 스키마 필드: ${key} enum은 문자열이어야 합니다.`);
  }

  return enumValues.map((value) => ({
    value: value as string,
    label: formatSchemaEnumLabel(value as string),
  }));
}

export function formatSchemaEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

export function prefixCurationFieldModelKey(
  field: CurationFieldModel,
  prefix: string
): CurationFieldModel {
  const key = `${prefix}.${field.key}`;

  return { ...field, key };
}

export interface AlcoholCardListFieldParams {
  key: string;
  label: string;
  required: boolean;
  minItems: number;
  maxItems?: number;
  /** 위스키 카드 1건의 스키마 (alcohol/selectedTags/comment 계약을 담는다) */
  itemSchema: JsonSchemaNode;
}

// 위스키 카드 아이템 스키마를 카드 리스트 field model로 변환합니다.
// 시음회(속성 배열)와 추천/페어링(루트 배열)이 동일한 아이템 계약을 공유하므로 빌더도 하나입니다.
export function createAlcoholCardListFieldModel({
  key,
  label,
  required,
  minItems,
  maxItems,
  itemSchema,
}: AlcoholCardListFieldParams): CurationWhiskyCardListFieldModel {
  const alcoholSchema = getSchemaProperty(itemSchema, 'alcohol');
  const selectedTagsSchema = getSchemaProperty(alcoholSchema, 'selectedTags');
  const commentSchema = itemSchema.properties?.comment;

  return {
    key,
    kind: 'alcohol-card-list',
    label,
    required,
    minItems,
    maxItems,
    selectedTags: {
      label: getSchemaDisplayLabel(selectedTagsSchema) || '테이스팅 태그',
      required: isSchemaPropertyRequired(alcoholSchema, 'selectedTags'),
      minItems: selectedTagsSchema.minItems ?? 1,
      maxItems: selectedTagsSchema.maxItems ?? 12,
    },
    comment: {
      label: (commentSchema && getSchemaDisplayLabel(commentSchema)) || '큐레이터 코멘트',
      required: isSchemaPropertyRequired(itemSchema, 'comment'),
      maxLength: commentSchema?.maxLength ?? 500,
    },
  };
}
