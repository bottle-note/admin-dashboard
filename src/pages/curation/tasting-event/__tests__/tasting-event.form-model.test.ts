import { describe, expect, it } from 'vitest';

import type { CurationV2Spec } from '@/types/api';

import { createTastingEventFormModel } from '../tasting-event.form-model';

const tastingEventSpec: CurationV2Spec = {
  id: 3,
  code: 'WHISKY_TASTING_EVENT',
  name: '위스키 시음회',
  description: '시음회 날짜, 장소, 참가 정보와 시음 위스키 라인업',
  hydratorKey: 'alcohol',
  version: 2,
  isActive: true,
  requestSpec: {
    type: 'object',
    required: [
      'eventDate',
      'eventTime',
      'barAddress',
      'detailAddress',
      'entryFee',
      'capacity',
      'applicationLink',
      'guideText',
      'alcohols',
    ],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        description: '시음회 날짜',
        'x-display-name': '시음회 날짜',
      },
      eventTime: {
        type: 'string',
        description: '시음회 시간',
        'x-display-name': '시음회 시간',
      },
      barAddress: {
        type: 'string',
        maxLength: 200,
        description: '장소 및 바 주소',
        'x-field-style': 'plain-text',
        'x-display-name': '장소 및 바(bar) 주소',
      },
      detailAddress: {
        type: 'string',
        maxLength: 200,
        description: '상세 주소',
        'x-display-name': '상세 주소',
      },
      isRecruiting: {
        type: 'boolean',
        description: '시음회 참여자 모집 여부',
        'x-display-name': '참여자 모집 여부',
      },
      entryFee: {
        type: 'integer',
        minimum: 0,
        description: '참가비',
        'x-display-name': '참가비(1인당)',
      },
      capacity: {
        type: 'integer',
        minimum: 1,
        maximum: 999,
        description: '총 모집 인원수',
        'x-display-name': '총 모집 인원수',
      },
      applicationLink: {
        type: 'string',
        maxLength: 2048,
        description: '신청 링크',
        'x-field-style': 'plain-text',
        'x-display-name': '신청링크',
      },
      guideText: {
        type: 'string',
        maxLength: 1000,
        description: '시음회 안내사항',
        'x-field-style': 'long-text',
        'x-display-name': '안내사항',
      },
      alcohols: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        description: '시음 위스키 라인업',
        'x-field-style': 'alcohol-card-list',
        'x-display-name': '시음 위스키',
        items: {
          type: 'object',
          required: ['source', 'alcohol'],
          properties: {
            source: {
              type: 'string',
              enum: ['BOTTLE_NOTE', 'MANUAL'],
            },
            alcohol: {
              type: 'object',
              required: ['korName', 'selectedTags'],
              properties: {
                korName: { type: 'string', 'x-display-name': '위스키 한글명' },
                selectedTags: {
                  type: 'array',
                  maxItems: 12,
                  'x-field-style': 'tag-list',
                  'x-display-name': '테이스팅 태그',
                  items: { type: 'string' },
                },
              },
            },
            comment: {
              type: 'string',
              maxLength: 500,
              'x-field-style': 'long-text',
              'x-display-name': '위스키 기대평',
            },
          },
        },
      },
    },
  },
  responseSpec: {
    type: 'object',
  },
};

describe('createTastingEventFormModel', () => {
  it('시음회 requestSpec의 라벨과 제약을 form model로 변환한다', () => {
    const formModel = createTastingEventFormModel(tastingEventSpec);
    const fieldsByKey = Object.fromEntries(
      formModel.payloadFields.map((field) => [field.key, field])
    );

    expect(fieldsByKey.barAddress).toMatchObject({
      label: '장소 및 바(bar) 주소',
      kind: 'text',
    });
    expect(fieldsByKey.entryFee).toMatchObject({
      label: '참가비(1인당)',
      suffix: '원',
    });
    expect(fieldsByKey.isRecruiting).toMatchObject({
      required: false,
      kind: 'boolean-radio',
      trueLabel: '네',
      falseLabel: '아니요, 광고만 하겠습니다.',
    });
    expect(fieldsByKey.capacity).toMatchObject({
      label: '총 모집 인원수',
      required: true,
      minimum: 1,
      maximum: 999,
      suffix: '명',
    });
    expect(fieldsByKey.applicationLink).toMatchObject({
      kind: 'text',
      maxLength: 2048,
    });
    expect(fieldsByKey.guideText).toMatchObject({
      kind: 'textarea',
      maxLength: 1000,
    });
    expect(fieldsByKey.alcohols).toMatchObject({
      kind: 'alcohol-card-list',
      label: '시음 위스키',
      required: true,
      minItems: 1,
      maxItems: 10,
      selectedTags: {
        label: '테이스팅 태그',
        required: true,
        minItems: 1,
        maxItems: 12,
      },
      comment: {
        label: '위스키 기대평',
        required: false,
        maxLength: 500,
      },
    });
    expect(formModel.sections.map((section) => section.id)).toEqual([
      'dateLocation',
      'participation',
      'alcoholLineup',
    ]);
    expect(formModel.sections.map((section) => section.stepNumber)).toEqual([2, 3, 4]);
    expect(formModel.sections.map((section) => section.description)).toEqual([
      '날짜 및 장소를 입력해주세요.',
      '참가비, 모집 인원, 신청 링크와 안내사항을 입력해주세요.',
      '앱에 노출될 시음회 위스키 라인업을 등록해주세요.',
    ]);
    expect(formModel.sections[0]!.fields.map(({ field }) => field.key)).toEqual([
      'eventDate',
      'eventTime',
      'barAddress',
      'detailAddress',
    ]);
    expect(formModel.sections[1]!.fields.map(({ field }) => field.key)).toEqual([
      'isRecruiting',
      'entryFee',
      'capacity',
      'applicationLink',
      'guideText',
    ]);
  });
});
