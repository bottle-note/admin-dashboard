import { describe, expect, it } from 'vitest';

import {
  createProgramFormValidationSchema,
  createWhiskyTastingEventFormValidationSchema,
  type ProgramFormValues,
  type ProgramRequestSpec,
  type WhiskyTastingEventFormValues,
  type WhiskyTastingEventRequestSpec,
} from '../curation-spec.schema';

const alcoholItem = {
  source: 'BOTTLE_NOTE' as const,
  alcohol: {
    alcoholId: 10,
    korName: '테스트 위스키',
    selectedTags: [] as string[],
  },
  comment: '',
};

const tastingEventValues = {
  name: '시음회',
  description: '',
  imageUrls: [],
  exposureStartDate: '',
  exposureEndDate: '',
  displayOrder: 0,
  isActive: true,
  eventDate: '',
  eventTime: '',
  barAddress: '',
  detailAddress: '',
  capacity: 0,
  entryFee: 0,
  guideText: '',
  alcohols: [],
} satisfies WhiskyTastingEventFormValues;

const tastingEventRequestSpec = {
  properties: {
    alcohols: {
      minItems: 1,
      maxItems: 2,
      'x-display-name': '시음 위스키',
      items: {
        properties: {
          alcohol: {
            properties: {
              selectedTags: {
                maxItems: 1,
                'x-display-name': '테이스팅 태그',
              },
            },
          },
        },
      },
    },
  },
} as unknown as WhiskyTastingEventRequestSpec;

const programValues = {
  name: '프로그램 큐레이션',
  description: '',
  imageUrls: [],
  exposureStartDate: '',
  exposureEndDate: '',
  displayOrder: 0,
  isActive: true,
  eventStartDate: '',
  eventEndDate: '',
  placeName: '',
  address: '',
  programs: [],
} satisfies ProgramFormValues;

const programRequestSpec = {
  properties: {
    programTags: {
      minItems: 0,
      maxItems: 2,
      'x-display-name': '프로그램 태그',
    },
    programs: {
      minItems: 1,
      maxItems: 2,
      'x-display-name': '프로그램',
      items: {
        required: ['whiskies'],
        properties: {
          whiskies: {
            minItems: 0,
            maxItems: 1,
            'x-display-name': '시음 위스키',
            items: {
              properties: {
                alcohol: {
                  properties: {
                    selectedTags: {
                      maxItems: 1,
                      'x-display-name': '테이스팅 태그',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as unknown as ProgramRequestSpec;

describe('curation spec form validation', () => {
  it('서버 스펙의 시음 위스키 minItems와 maxItems를 적용한다', () => {
    const schema = createWhiskyTastingEventFormValidationSchema(tastingEventRequestSpec);

    expect(schema.safeParse(tastingEventValues).success).toBe(false);
    expect(schema.safeParse({ ...tastingEventValues, alcohols: [alcoholItem] }).success).toBe(true);
    expect(
      schema.safeParse({
        ...tastingEventValues,
        alcohols: [alcoholItem, alcoholItem, alcoholItem],
      }).success
    ).toBe(false);
  });

  it('테이스팅 태그는 빈 배열을 허용하고 서버 maxItems만 적용한다', () => {
    const schema = createWhiskyTastingEventFormValidationSchema(tastingEventRequestSpec);

    expect(schema.safeParse({ ...tastingEventValues, alcohols: [alcoholItem] }).success).toBe(true);
    expect(
      schema.safeParse({
        ...tastingEventValues,
        alcohols: [
          {
            ...alcoholItem,
            alcohol: { ...alcoholItem.alcohol, selectedTags: ['바닐라', '꿀'] },
          },
        ],
      }).success
    ).toBe(false);
  });

  it('참가자를 모집할 때만 신청 링크를 필수로 검증한다', () => {
    const schema = createWhiskyTastingEventFormValidationSchema(tastingEventRequestSpec);

    expect(
      schema.safeParse({
        ...tastingEventValues,
        isRecruiting: true,
        applicationLink: '',
        alcohols: [alcoholItem],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...tastingEventValues,
        isRecruiting: false,
        applicationLink: '',
        alcohols: [alcoholItem],
      }).success
    ).toBe(true);
  });

  it('PROGRAM과 중첩 위스키 목록에 각각의 서버 배열 제한을 적용한다', () => {
    const schema = createProgramFormValidationSchema(programRequestSpec);
    const program = {
      name: '마스터 클래스',
      type: 'MASTER_CLASS' as const,
      programDate: '',
      startTime: '',
      description: '',
      whiskies: [],
    };

    expect(schema.safeParse(programValues).success).toBe(false);
    expect(schema.safeParse({ ...programValues, programs: [program] }).success).toBe(true);
    expect(
      schema.safeParse({
        ...programValues,
        programs: [{ ...program, whiskies: [alcoholItem, alcoholItem] }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...programValues,
        programTags: ['WHISKY', 'COCKTAIL', 'BEER'],
        programs: [program],
      }).success
    ).toBe(false);
  });

  it('resolver 사용 시에도 requestSpec의 필수 문자열 검증을 유지한다', () => {
    const schema = createWhiskyTastingEventFormValidationSchema({
      ...tastingEventRequestSpec,
      required: ['guideText'],
    });

    expect(
      schema.safeParse({ ...tastingEventValues, guideText: '', alcohols: [alcoholItem] }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...tastingEventValues,
        guideText: '참가 안내',
        alcohols: [alcoholItem],
      }).success
    ).toBe(true);
  });
});
