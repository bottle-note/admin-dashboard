import type { JsonSchemaNode } from '@/types/api';

import type { CurationWhiskyCardListFieldModel } from './curation-whisky-card-list.types';

export type CurationFieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'number'
  | 'boolean-radio'
  | 'alcohol-card-list';

export interface CurationBaseFieldModel {
  key: string;
  label: string;
  required: boolean;
  kind: CurationFieldKind;
  description?: string;
  fieldStyle?: string;
  placeholder?: string;
  defaultValue?: unknown;
}

export interface CurationTextFieldModel extends CurationBaseFieldModel {
  kind: 'text' | 'textarea' | 'date' | 'time';
  maxLength?: number;
}

export interface CurationNumberFieldModel extends CurationBaseFieldModel {
  kind: 'number';
  numberType: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  suffix?: string;
}

export interface CurationBooleanRadioFieldModel extends CurationBaseFieldModel {
  kind: 'boolean-radio';
  trueLabel: string;
  falseLabel: string;
}

export type CurationBasicFieldModel =
  | CurationTextFieldModel
  | CurationNumberFieldModel
  | CurationBooleanRadioFieldModel;

export type CurationFieldModel = CurationBasicFieldModel | CurationWhiskyCardListFieldModel;

export interface CurationSectionFieldModel {
  field: CurationFieldModel;
  className?: string;
}

export interface CurationFormSectionModel {
  id: string;
  title: string;
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
  const payloadFields = Object.keys(getSchemaProperties(requestSpec)).map((key) => {
    const fieldSchema = getSchemaProperty(requestSpec, key);
    const kind = getSchemaFieldKind(key, fieldSchema);
    const customField = options.createCustomField?.({ requestSpec, fieldSchema, key, kind });

    if (customField) {
      return customField;
    }

    const basicField = createCurationBasicFieldModel(requestSpec, key);
    return options.overrideField?.(basicField) ?? basicField;
  });

  return {
    payloadFields,
    sections: options.createSections(payloadFields),
  };
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
  if (fieldStyle === 'long-text') return 'textarea';
  if (fieldStyle === 'plain-text') return 'text';
  if (fieldStyle === 'alcohol-card-list') return 'alcohol-card-list';
  if (fieldStyle === 'time') return 'time';
  if (fieldStyle === 'date') return 'date';
  if (schema.format === 'date') return 'date';
  if (schema.format === 'time') return 'time';
  if (key.toLowerCase().includes('time')) return 'time';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean-radio';
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
    case 'textarea':
    case 'date':
    case 'time':
    case 'text':
      return {
        ...base,
        kind,
        maxLength: fieldSchema.maxLength,
      };
    case 'alcohol-card-list':
      throw new Error('alcohol-card-list는 도메인 전용 field model 생성 함수에서 처리해야 합니다.');
  }
}
