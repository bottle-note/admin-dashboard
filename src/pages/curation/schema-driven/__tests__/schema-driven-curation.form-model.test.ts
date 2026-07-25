import { describe, expect, it } from 'vitest';

import type { CurationV2Spec } from '@/types/api';

import { createSchemaDrivenCurationFormModel } from '../schema-driven-curation.form-model';
import { programSpec } from './program-spec.fixture';

describe('createSchemaDrivenCurationFormModel', () => {
  it('object requestSpec의 primitive, enum, enum array, object array를 모델로 만든다', () => {
    const model = createSchemaDrivenCurationFormModel(programSpec);

    expect(model.payloadFields.map((field) => [field.key, field.kind])).toEqual([
      ['eventStartDate', 'date'],
      ['eventEndDate', 'date'],
      ['placeName', 'text'],
      ['address', 'text'],
      ['entryFee', 'number'],
      ['programTags', 'multi-select'],
      ['programs', 'object-array'],
    ]);

    const programTags = model.payloadFields.find((field) => field.key === 'programTags');
    expect(programTags).toMatchObject({
      kind: 'multi-select',
      maxItems: 2,
      options: [
        { value: 'WHISKY', label: 'Whisky' },
        { value: 'COCKTAIL', label: 'Cocktail' },
        { value: 'BEER', label: 'Beer' },
      ],
    });
  });

  it('object array 안의 enum과 alcohol-card-list를 재귀 모델로 만든다', () => {
    const model = createSchemaDrivenCurationFormModel(programSpec);
    const programs = model.payloadFields.find((field) => field.key === 'programs');

    expect(programs).toMatchObject({
      kind: 'object-array',
      minItems: 1,
      maxItems: 20,
    });

    if (!programs || programs.kind !== 'object-array') {
      throw new Error('programs object-array 모델이 필요합니다.');
    }

    expect(programs.itemFields.map((field) => [field.key, field.kind])).toEqual([
      ['name', 'text'],
      ['type', 'select'],
      ['programDate', 'date'],
      ['startTime', 'time'],
      ['endTime', 'time'],
      ['description', 'textarea'],
      ['whiskies', 'alcohol-card-list'],
    ]);
    expect(programs.itemFields.find((field) => field.key === 'whiskies')).toMatchObject({
      label: '시음 위스키',
      minItems: 0,
      maxItems: 10,
    });
  });

  it('지원하지 않는 object 단일 필드는 명시적으로 실패한다', () => {
    const unsupportedSpec: CurationV2Spec = {
      ...programSpec,
      requestSpec: {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
        },
      },
    };

    expect(() => createSchemaDrivenCurationFormModel(unsupportedSpec)).toThrow(
      '지원하지 않는 큐레이션 스키마 필드'
    );
  });
});
