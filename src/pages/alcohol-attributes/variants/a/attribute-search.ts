import { z } from 'zod';
import type {
  AttributeSearchCondition,
  AttributeSearchOperator,
} from '@/types/api/alcohol-attribute.api';
import { valueError, type Attribute } from './attribute-model';

export const searchOperators = {
  EQ: '같음 (=)',
  NE: '다름 (≠)',
  GT: '초과 (>)',
  GTE: '이상 (≥)',
  LT: '미만 (<)',
  LTE: '이하 (≤)',
  CONTAINS: '포함',
  EXISTS: '속성 있음',
  NOT_EXISTS: '속성 없음',
} satisfies Record<AttributeSearchOperator, string>;
export type AttributeSearch = { match: 'AND' | 'OR'; conditions: AttributeSearchCondition[] };
export const emptySearch: AttributeSearch = { match: 'AND', conditions: [] };
const conditionSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
    operator: z.enum(['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS', 'EXISTS', 'NOT_EXISTS']),
    value: z.string().max(255).optional(),
  })
  .refine((condition) =>
    requiresSearchValue(condition.operator) ? !!condition.value?.trim() : !condition.value?.trim()
  );
export function readAttributeSearch(
  params: URLSearchParams,
  prefix = ''
): { value: AttributeSearch; error?: string } {
  try {
    const parsed = z
      .object({ match: z.enum(['AND', 'OR']), conditions: z.array(conditionSchema).max(20) })
      .parse({
        match: params.get(`${prefix}match`) ?? 'AND',
        conditions: JSON.parse(params.get(`${prefix}conditions`) ?? '[]'),
      });
    return { value: parsed };
  } catch {
    return {
      value: emptySearch,
      error: '검색 조건 URL이 올바르지 않습니다. 조건을 초기화해 주세요.',
    };
  }
}
export function requiresSearchValue(operator: AttributeSearchOperator) {
  return operator !== 'EXISTS' && operator !== 'NOT_EXISTS';
}
export function allowedOperators(datatype: Attribute['datatype']): AttributeSearchOperator[] {
  return [
    'EQ',
    'NE',
    ...(datatype === 'STRING'
      ? ['CONTAINS' as const]
      : datatype === 'BOOLEAN'
        ? []
        : (['GT', 'GTE', 'LT', 'LTE'] as const)),
    'EXISTS',
    'NOT_EXISTS',
  ];
}
export function conditionError(
  condition: AttributeSearchCondition,
  attribute?: Pick<Attribute, 'datatype' | 'allowedValues'>
) {
  if (!attribute) return '속성 정보를 확인할 수 없습니다.';
  if (!allowedOperators(attribute.datatype).includes(condition.operator))
    return '이 속성에 사용할 수 없는 연산자입니다.';
  if (
    searchValueForOperator(condition.operator, condition.value, attribute) === '' &&
    condition.value
  )
    return '허용값 목록에서 선택하세요.';
  return requiresSearchValue(condition.operator)
    ? valueError(attribute.datatype, condition.value ?? '')
    : undefined;
}

export function readGroupIds(params: URLSearchParams, prefix = '') {
  return [
    ...new Set(
      params
        .getAll(`${prefix}groupIds`)
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0)
    ),
  ].slice(0, 100);
}

export function searchValueForOperator(
  operator: AttributeSearchOperator,
  value: string | undefined,
  attribute?: Pick<Attribute, 'datatype' | 'allowedValues'>
) {
  if (!requiresSearchValue(operator)) return undefined;
  if (
    attribute?.datatype === 'STRING' &&
    attribute.allowedValues?.length &&
    (operator === 'EQ' || operator === 'NE') &&
    !attribute.allowedValues.includes(value ?? '')
  )
    return '';
  return value ?? '';
}
