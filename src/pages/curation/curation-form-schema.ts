import { z } from 'zod';

import type {
  CurationBasicFieldModel,
  CurationNumberFieldModel,
  CurationTextFieldModel,
} from './curation-form-model';

// text/date/time/textarea field model을 문자열 Zod schema로 변환합니다.
function createTextFieldValueSchema(field: CurationTextFieldModel): z.ZodType<unknown> {
  let schema = z.string();

  if (field.required) {
    schema = schema.min(1, `${field.label}는 필수입니다.`);
  }

  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `${field.label}는 최대 ${field.maxLength}자까지 입력할 수 있습니다.`
    );
  }

  return schema;
}

// number/integer field model을 숫자 Zod schema로 변환합니다.
function createNumberFieldValueSchema(field: CurationNumberFieldModel): z.ZodType<unknown> {
  let schema = z.number();

  if (field.numberType === 'integer') {
    schema = schema.int(`${field.label}는 정수로 입력해주세요.`);
  }

  if (typeof field.minimum === 'number') {
    schema = schema.min(field.minimum, `${field.label}는 ${field.minimum} 이상이어야 합니다.`);
  }

  if (typeof field.maximum === 'number') {
    schema = schema.max(
      field.maximum,
      `${field.label}는 최대 ${field.maximum}까지 입력할 수 있습니다.`
    );
  }

  return schema;
}

// field model의 kind에 맞는 Zod value schema를 생성합니다.
export function createCurationFieldValueSchema(field: CurationBasicFieldModel): z.ZodType<unknown> {
  switch (field.kind) {
    case 'number':
      return createNumberFieldValueSchema(field);
    case 'boolean-radio':
      return z.boolean();
    case 'text':
    case 'textarea':
    case 'date':
    case 'time':
    case 'address':
      return createTextFieldValueSchema(field);
  }
}
