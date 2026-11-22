import { z } from 'zod';
import type {
  AlcoholAttribute,
  AttributeCreateRequest,
  AttributeUpdateRequest,
} from '@/types/api/alcohol-attribute.api';

export const attributeFormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, '이름을 입력하세요.')
      .max(100, '100자 이내로 입력하세요.'),
    key: z.string().trim(),
    groupId: z.string(),
    type: z.enum(['KEYWORD', 'PRICE', 'POPULARITY', 'FLAG', 'IDENTITY', 'NOTE']),
    description: z.string().trim().max(500, '500자 이내로 입력하세요.'),
    datatype: z.enum(['STRING', 'INT', 'DOUBLE', 'BOOLEAN']),
    unit: z.string().trim().max(20, '20자 이내로 입력하세요.'),
    allowedValues: z.array(z.string()),
    pattern: z.string(),
    patternError: z.string(),
    allowMultipleValues: z.boolean(),
    isNew: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.isNew && !/^[a-z][a-z0-9_]{0,63}$/.test(values.key))
      ctx.addIssue({
        code: 'custom',
        path: ['key'],
        message: '소문자로 시작하는 영문·숫자·밑줄 64자 이내로 입력하세요.',
      });
    if (values.datatype !== 'STRING') return;
    if (values.allowedValues.length > 100)
      ctx.addIssue({
        code: 'custom',
        path: ['allowedValues'],
        message: '최대 100개까지 넣을 수 있어요.',
      });
    if (values.allowedValues.length === 0 && values.patternError)
      ctx.addIssue({ code: 'custom', path: ['patternError'], message: values.patternError });
  });

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;

export function attributeDefaultValues(groupId?: string | null): AttributeFormValues {
  return {
    displayName: '',
    key: '',
    groupId: groupId ?? '',
    type: 'KEYWORD',
    description: '',
    datatype: 'STRING',
    unit: '',
    allowedValues: [],
    pattern: '',
    patternError: '',
    allowMultipleValues: false,
    isNew: true,
  };
}

export function toAttributeFormValues(attribute: AlcoholAttribute): AttributeFormValues {
  return {
    displayName: attribute.displayName,
    key: attribute.key,
    groupId: attribute.groupId == null ? '' : String(attribute.groupId),
    type: attribute.type,
    description: attribute.description ?? '',
    datatype: attribute.datatype,
    unit: attribute.unit ?? '',
    allowedValues: attribute.allowedValues ?? [],
    pattern: attribute.pattern ?? '',
    patternError: '',
    allowMultipleValues: attribute.allowMultipleValues ?? false,
    isNew: false,
  };
}

// 수정 API는 빠진 필드를 비운 값으로 저장하므로 규칙 필드를 항상 함께 보낸다.
export function toAttributeUpdateRequest(values: AttributeFormValues): AttributeUpdateRequest {
  const isString = values.datatype === 'STRING';
  return {
    displayName: values.displayName.trim(),
    groupId: values.groupId ? Number(values.groupId) : null,
    type: values.type,
    datatype: values.datatype,
    unit: values.unit.trim() || null,
    description: values.description.trim() || null,
    allowMultipleValues: values.allowMultipleValues,
    allowedValues: isString && values.allowedValues.length ? values.allowedValues : null,
    pattern: isString ? values.pattern || null : null,
  };
}

export function toAttributeCreateRequest(values: AttributeFormValues): AttributeCreateRequest {
  return { key: values.key.trim(), ...toAttributeUpdateRequest(values) };
}
