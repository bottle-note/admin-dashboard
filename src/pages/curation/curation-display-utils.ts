import type { CurationV2Payload, JsonSchemaNode } from '@/types/api';

import { getSchemaDisplayLabel, getSchemaProperties } from './curation-form-model';

export function formatCurationSpecCode(code: string): string {
  switch (code) {
    case 'WHISKY_TASTING_EVENT':
      return '위스키 시음회';
    case 'RECOMMENDED_WHISKY':
      return '추천 위스키';
    case 'WHISKY_PAIRING':
      return '위스키 페어링';
    default:
      return code;
  }
}

export function formatCurationDate(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatCurationDateTime(value: string | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCurationExposurePeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate && !endDate) return '상시 노출';

  return `${formatCurationDate(startDate)} ~ ${formatCurationDate(endDate)}`;
}

export function getCurationPayloadEntries(requestSpec: JsonSchemaNode, payload: CurationV2Payload) {
  if (Array.isArray(payload)) {
    // x-container: "array" 스펙은 requestSpec 루트가 아이템 스키마 → 라벨을 스펙에서 읽는다.
    return [
      {
        key: 'items',
        label: getSchemaDisplayLabel(requestSpec) || '아이템',
        schema: requestSpec,
        value: payload,
      },
    ];
  }

  const properties = getSchemaProperties(requestSpec);
  const schemaKeys = Object.keys(properties);
  const extraKeys = Object.keys(payload).filter((key) => !schemaKeys.includes(key));

  return [...schemaKeys, ...extraKeys].map((key) => ({
    key,
    label: properties[key] ? getSchemaDisplayLabel(properties[key]!) : key,
    schema: properties[key],
    value: payload[key],
  }));
}

export function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니요';
  if (typeof value === 'number') return value.toLocaleString('ko-KR');
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length.toLocaleString('ko-KR')}개`;

  return JSON.stringify(value);
}
