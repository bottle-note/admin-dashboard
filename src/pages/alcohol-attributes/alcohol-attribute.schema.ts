/**
 * 위스키 속성 화면 공용 상수·폼 스키마·표시 도우미
 */

import { z } from 'zod';

import { formatNumber } from '@/lib/format';

import type {
  AlcoholAttributeDatatype,
  AlcoholAttributeEnums,
  AlcoholAttributeKeyStat,
  AlcoholAttributeRow,
  AlcoholAttributeSummaryItem,
  AlcoholAttributeType,
} from '@/types/api';

/** 키워드 빠른 추가에 쓰는 기본 항목(key). 실제로는 집계에서 가장 많이 쓰인 KEYWORD 항목을 우선한다 */
export const DEFAULT_KEYWORD_KEY = 'keyword';

/** 화면 라벨. enums 응답이 오기 전에는 코드를 그대로 보여준다 */
export type AttributeLabels = {
  types: Partial<Record<AlcoholAttributeType, string>>;
  datatypes: Partial<Record<AlcoholAttributeDatatype, string>>;
};

export function labelsOf(enums?: AlcoholAttributeEnums): AttributeLabels {
  return {
    types: Object.fromEntries((enums?.types ?? []).map((item) => [item.code, item.korName])),
    datatypes: Object.fromEntries(
      (enums?.datatypes ?? []).map((item) => [item.code, item.korName])
    ),
  };
}

// ============================================
// 값 검증 (백엔드 AttributeDatatype 규칙과 같다)
// ============================================

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const VALUE_PATTERN: Record<AlcoholAttributeDatatype, RegExp> = {
  STRING: /.+/s,
  INT: /^-?\d{1,18}$/,
  DOUBLE: /^-?\d{1,15}(\.\d{1,6})?$/,
  BOOLEAN: /^(true|false)$/,
};
const VALUE_HINT: Record<AlcoholAttributeDatatype, string> = {
  STRING: '값을 입력하세요.',
  INT: '소수점 없는 정수만 입력할 수 있습니다.',
  DOUBLE: '숫자만 입력할 수 있습니다. 소수점 아래는 6자리까지입니다.',
  BOOLEAN: '예 또는 아니오를 고르세요.',
};

/** 입력한 항목을 백엔드 규칙(소문자·숫자·밑줄)에 맞게 다듬는다 */
export function normalizeKey(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export const attributeFormSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, '항목을 입력하세요.')
      .regex(
        KEY_PATTERN,
        '영문 소문자로 시작하고 소문자·숫자·밑줄만 쓸 수 있습니다. 64자 이내입니다.'
      ),
    type: z.enum(['KEYWORD', 'POPULARITY', 'PRICE', 'FLAG', 'IDENTITY', 'NOTE']),
    datatype: z.enum(['STRING', 'INT', 'DOUBLE', 'BOOLEAN']),
    value: z.string().trim().min(1, '값을 입력하세요.').max(255, '값은 255자 이내입니다.'),
    description: z.string().trim().max(500, '근거는 500자 이내입니다.'),
    /** datetime-local 입력값(YYYY-MM-DDTHH:mm). 비우면 없음 */
    basedAt: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!VALUE_PATTERN[values.datatype].test(values.value)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: VALUE_HINT[values.datatype] });
    }
  });

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;

export const attributeFormDefaultValues: AttributeFormValues = {
  key: '',
  type: 'KEYWORD',
  datatype: 'STRING',
  value: '',
  description: '',
  basedAt: '',
};

/** 행을 수정 폼 값으로 바꾼다 */
export function rowToFormValues(row: AlcoholAttributeRow): AttributeFormValues {
  return {
    key: row.key,
    type: row.type,
    datatype: row.datatype,
    value: row.value,
    description: row.description ?? '',
    basedAt: row.basedAt ? row.basedAt.slice(0, 16) : '',
  };
}

/** datetime-local 값을 서버 LocalDateTime 문자열로 바꾼다 */
export function toBasedAtPayload(input: string): string | null {
  if (!input) return null;
  return input.length === 16 ? `${input}:00` : input;
}

// ============================================
// 표시 도우미
// ============================================

export { formatNumber };

/** '2026-10-01T00:00:00' → '2026.10.01 00:00' */
export function formatDateTime(value: string | null) {
  if (!value) return '-';
  const [date, time] = value.split('T');
  const dotted = (date ?? '').replace(/-/g, '.');
  return time ? `${dotted} ${time.slice(0, 5)}` : dotted;
}

/** 값 형식에 맞춰 사람이 읽는 형태로 바꾼다 */
export function formatValue(datatype: AlcoholAttributeDatatype, value: string) {
  if (datatype === 'BOOLEAN') return value === 'true' ? '예' : '아니오';
  if (datatype === 'INT' || datatype === 'DOUBLE') {
    const number = Number(value);
    return Number.isFinite(number) ? formatNumber(number) : value;
  }
  return value;
}

export function isNumericDatatype(datatype: AlcoholAttributeDatatype) {
  return datatype === 'INT' || datatype === 'DOUBLE';
}

/** 묶음 요약의 값 표기. 숫자 묶음은 범위, 값이 같으면 하나만 */
export function formatSummaryValue(item: AlcoholAttributeSummaryItem) {
  if (isNumericDatatype(item.datatype) && item.min != null && item.max != null) {
    return item.allSameValue
      ? formatNumber(item.min)
      : `${formatNumber(item.min)} ~ ${formatNumber(item.max)}`;
  }
  if (item.value == null) return '-';
  return formatValue(item.datatype, item.value);
}

/**
 * 묶음을 빠진 위스키에도 그대로 적용할 수 있을 때 그 값을 돌려준다.
 * 숫자 묶음은 값이 모두 같을 때만 적용할 수 있다.
 */
export function applicableValue(item: AlcoholAttributeSummaryItem): string | null {
  if (item.value != null) return item.value;
  if (isNumericDatatype(item.datatype) && item.allSameValue && item.min != null) {
    return String(item.min);
  }
  return null;
}

/** 묶음 접근성 이름. 값이 있으면 "key · value" */
export function summaryGroupName(item: AlcoholAttributeSummaryItem) {
  return item.value != null ? `${item.key} · ${item.value}` : item.key;
}

/** 목록 표에 피벗 열로 세울 항목 수. 나머지는 시트에서 본다 */
export const PIVOT_COLUMN_LIMIT = 4;

/** 키워드가 아닌 항목 가운데 위스키 수가 많은 순으로 피벗 열을 고른다 */
export function pickPivotKeys(keyStats: AlcoholAttributeKeyStat[]) {
  const seen = new Set<string>();
  return keyStats
    .filter((stat) => stat.type !== 'KEYWORD')
    .sort((a, b) => b.alcoholCount - a.alcoholCount || a.key.localeCompare(b.key))
    .filter((stat) => (seen.has(stat.key) ? false : seen.add(stat.key)))
    .slice(0, PIVOT_COLUMN_LIMIT);
}
