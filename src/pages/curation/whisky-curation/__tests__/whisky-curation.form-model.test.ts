import { describe, expect, it } from 'vitest';

import { CurationSpecCode, type CurationV2Spec } from '@/types/api';

import { createWhiskyCurationFormModel } from '../whisky-curation.schema';

function createWhiskySpec(options: {
  code: CurationV2Spec['code'];
  includePairings: boolean;
}): CurationV2Spec {
  return {
    id: options.code === CurationSpecCode.WHISKY_PAIRING ? 2 : 1,
    code: options.code,
    name: options.code === CurationSpecCode.WHISKY_PAIRING ? '위스키 페어링' : '추천 위스키',
    description: null,
    hydratorKey: 'alcohol',
    version: 1,
    isActive: true,
    requestSpec: {
      type: 'object',
      required: options.includePairings ? ['source', 'alcohol', 'pairings'] : ['source', 'alcohol'],
      properties: {
        source: {
          type: 'string',
          enum: ['BOTTLE_NOTE', 'MANUAL'],
        },
        alcohol: {
          type: 'object',
          required: ['korName', 'selectedTags'],
          'x-display-name':
            options.code === CurationSpecCode.WHISKY_PAIRING ? '페어링 위스키' : '추천 위스키',
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
          'x-display-name': '추천 코멘트',
        },
        ...(options.includePairings
          ? {
              pairings: {
                type: 'array',
                minItems: 1,
                maxItems: 5,
                'x-field-style': 'pairing-food-list',
                'x-display-name': '페어링 음식',
                items: {
                  type: 'object',
                  required: ['itemName', 'pairingNote'],
                  properties: {
                    itemName: {
                      type: 'string',
                      maxLength: 100,
                      'x-display-name': '음식명',
                    },
                    pairingNote: {
                      type: 'string',
                      maxLength: 500,
                      'x-display-name': '페어링 설명',
                    },
                  },
                },
              },
            }
          : {}),
      },
      'x-container': 'array',
      'x-form-style': 'alcohol-list',
      'x-field-style': 'alcohol-card',
    },
    responseSpec: {
      type: 'object',
    },
  };
}

describe('createWhiskyCurationFormModel', () => {
  it('추천 specCode이면 requestSpec에 pairings 필드가 있어도 페어링 모델을 만들지 않는다', () => {
    const formModel = createWhiskyCurationFormModel(
      createWhiskySpec({
        code: CurationSpecCode.RECOMMENDED_WHISKY,
        includePairings: true,
      })
    );

    expect(formModel.pairings).toBeUndefined();
  });

  it('WHISKY_PAIRING specCode이면 pairings 스키마로 페어링 모델을 만든다', () => {
    const formModel = createWhiskyCurationFormModel(
      createWhiskySpec({
        code: CurationSpecCode.WHISKY_PAIRING,
        includePairings: true,
      })
    );

    expect(formModel.pairings).toMatchObject({
      label: '페어링 음식',
      minItems: 1,
      maxItems: 5,
      itemNameLabel: '음식명',
      pairingNoteLabel: '페어링 설명',
    });
  });

  it('WHISKY_PAIRING specCode인데 pairings 필드가 없으면 스펙 계약 오류를 낸다', () => {
    expect(() =>
      createWhiskyCurationFormModel(
        createWhiskySpec({
          code: CurationSpecCode.WHISKY_PAIRING,
          includePairings: false,
        })
      )
    ).toThrow('requestSpec에 pairings 필드가 없습니다.');
  });
});
