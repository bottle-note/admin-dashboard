import { describe, expect, it } from 'vitest';

import { createSchemaDrivenCurationFormModel } from '../schema-driven-curation.form-model';
import {
  createDefaultSchemaDrivenCurationFormState,
  createSchemaDrivenCurationFormSchema,
} from '../schema-driven-curation.schema';
import { programSpec } from './program-spec.fixture';

describe('schema driven curation validation', () => {
  const formModel = createSchemaDrivenCurationFormModel(programSpec);
  const schema = createSchemaDrivenCurationFormSchema(formModel);

  it('required root field와 programs minItems를 검증한다', () => {
    const result = schema.safeParse(createDefaultSchemaDrivenCurationFormState(formModel));

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors.eventStartDate).toContain(
      '행사 시작일은 필수입니다.'
    );
    expect(result.error.flatten().fieldErrors.programs).toContain(
      '프로그램을 최소 1개 이상 추가해주세요.'
    );
  });

  it('enum array maxItems와 enum 값을 검증한다', () => {
    const values = createValidValues();
    values.programTags = ['WHISKY', 'COCKTAIL', 'BEER'];
    values.programs[0]!.type = 'UNKNOWN';

    const result = schema.safeParse(values);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['programTags'],
          message: '프로그램 태그는 최대 2개까지 선택할 수 있습니다.',
        }),
        expect.objectContaining({
          path: ['programs', 0, 'type'],
        }),
      ])
    );
  });

  it('행사 종료일과 프로그램 종료 시간의 순서를 검증한다', () => {
    const values = createValidValues();
    values.eventEndDate = '2026-07-23';
    values.programs[0]!.endTime = '13:00';

    const result = schema.safeParse(values);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['eventEndDate'],
          message: '행사 종료일은 행사 시작일보다 빠를 수 없습니다.',
        }),
        expect.objectContaining({
          path: ['programs', 0, 'endTime'],
          message: '종료 시간은 시작 시간보다 빠를 수 없습니다.',
        }),
      ])
    );
  });

  function createValidValues() {
    return {
      ...createDefaultSchemaDrivenCurationFormState(formModel),
      name: '2026 바쇼',
      description: '프로그램 소개',
      exposureStartDate: '2026-07-01',
      exposureEndDate: '2026-07-31',
      eventStartDate: '2026-07-24',
      eventEndDate: '2026-07-26',
      placeName: '코엑스',
      address: '서울 강남구 영동대로 513',
      programTags: [] as string[],
      programs: [
        {
          name: '마스터클래스',
          type: 'MASTER_CLASS',
          programDate: '2026-07-24',
          startTime: '14:00',
          endTime: '15:30',
          description: '브랜드 앰버서더와 함께합니다.',
          whiskies: [],
        },
      ],
    };
  }
});
