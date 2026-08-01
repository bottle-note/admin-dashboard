import type { CurationV2Spec } from '@/types/api';

export const programSpec: CurationV2Spec = {
  id: 4,
  code: 'PROGRAM',
  name: '프로그램',
  description: '여러 프로그램과 프로그램별 위스키 라인업을 발행합니다.',
  hydratorKey: 'alcohol',
  version: 1,
  isActive: true,
  requestSpec: {
    type: 'object',
    required: ['eventStartDate', 'eventEndDate', 'placeName', 'address', 'programs'],
    properties: {
      eventStartDate: {
        type: 'string',
        format: 'date',
        'x-display-name': '행사 시작일',
      },
      eventEndDate: {
        type: 'string',
        format: 'date',
        'x-display-name': '행사 종료일',
      },
      placeName: {
        type: 'string',
        maxLength: 100,
        'x-field-style': 'address-search',
        'x-display-name': '장소명',
        'x-place-search-targets': {
          placeName: 'placeName',
          kakaoPlaceId: 'id',
          address: 'address',
        },
      },
      kakaoPlaceId: {
        type: 'string',
        minLength: 1,
        maxLength: 20,
        'x-field-style': 'hidden',
        'x-display-name': 'Kakao 장소 ID',
      },
      address: {
        type: 'string',
        maxLength: 200,
        'x-field-style': 'plain-text',
        'x-read-only': true,
        'x-display-name': '장소 및 주소',
      },
      detailAddress: {
        type: 'string',
        maxLength: 200,
        nullable: true,
        'x-field-style': 'plain-text',
        'x-display-name': '상세 주소',
      },
      entryFee: {
        type: 'integer',
        minimum: 0,
        nullable: true,
        'x-display-name': '참가비',
      },
      programTags: {
        type: 'array',
        maxItems: 2,
        'x-display-name': '프로그램 태그',
        items: {
          type: 'string',
          enum: ['WHISKY', 'COCKTAIL', 'BEER'],
        },
      },
      programs: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        'x-display-name': '프로그램',
        items: {
          type: 'object',
          required: ['name', 'type', 'programDate', 'startTime', 'description'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 120,
              'x-display-name': '프로그램명',
            },
            type: {
              type: 'string',
              enum: ['MASTER_CLASS', 'TASTING', 'SEMINAR'],
              'x-display-name': '프로그램 유형',
            },
            programDate: {
              type: 'string',
              format: 'date',
              'x-display-name': '날짜',
            },
            startTime: {
              type: 'string',
              format: 'time',
              'x-display-name': '시작 시간',
            },
            endTime: {
              type: 'string',
              format: 'time',
              nullable: true,
              'x-display-name': '종료 시간',
            },
            description: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              'x-field-style': 'long-text',
              'x-display-name': '프로그램 설명',
            },
            whiskies: {
              type: 'array',
              maxItems: 10,
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
                      alcoholId: { type: 'integer', nullable: true },
                      korName: { type: 'string', maxLength: 100 },
                      selectedTags: {
                        type: 'array',
                        maxItems: 12,
                        items: { type: 'string' },
                        'x-display-name': '테이스팅 태그',
                      },
                    },
                  },
                  comment: {
                    type: 'string',
                    maxLength: 500,
                    nullable: true,
                    'x-display-name': '위스키 기대평',
                  },
                },
              },
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
