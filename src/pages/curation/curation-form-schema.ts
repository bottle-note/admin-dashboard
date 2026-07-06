import { z } from 'zod';

import type {
  CurationBasicFieldModel,
  CurationNumberFieldModel,
  CurationTextFieldModel,
} from './curation-form-model';

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

  if (field.required) {
    schema = schema.min(1, `${formatCurationFieldTopic(field.label)} 필수입니다.`);
  }

  if (field.maxLength) {
    schema = schema.max(
      field.maxLength,
      `${formatCurationFieldTopic(field.label)} 최대 ${field.maxLength}자까지 입력할 수 있습니다.`
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
