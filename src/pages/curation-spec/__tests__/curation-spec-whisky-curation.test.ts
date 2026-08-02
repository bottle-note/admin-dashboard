import { describe, expect, it } from 'vitest';

import { getRecommendedWhiskySections } from '../recommended-whisky/recommended-whisky-sections';
import { getWhiskyPairingSections } from '../whisky-pairing/whisky-pairing-sections';
import {
  whiskyCurationDetailPayloadSchema,
  whiskyCurationPayloadSchema,
  whiskyCurationRequestSpecSchema,
} from '../curation-spec.schema';

const recommendedWhiskyRequestSpec = {
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
      'x-display-name': '추천 위스키',
      properties: {
        alcoholId: { type: 'integer' },
        korName: { type: 'string', 'x-display-name': '위스키 한글명' },
        engName: { type: 'string', 'x-display-name': '위스키 영문명' },
        imageUrl: { type: 'string' },
        abv: { type: 'string' },
        cask: { type: 'string' },
        volume: { type: 'string' },
        regionName: { type: 'string' },
        korCategory: { type: 'string' },
        selectedTags: {
          type: 'array',
          maxItems: 12,
          'x-field-style': 'tag-list',
          items: { type: 'string' },
        },
      },
    },
    comment: {
      type: 'string',
      maxLength: 500,
      'x-display-name': '추천 코멘트',
    },
  },
  'x-container': 'array',
  'x-form-style': 'alcohol-list',
  'x-field-style': 'alcohol-card',
} as const;

const whiskyPairingRequestSpec = {
  ...recommendedWhiskyRequestSpec,
  'x-form-style': 'pairing-list',
  required: ['source', 'alcohol', 'pairings'],
  properties: {
    ...recommendedWhiskyRequestSpec.properties,
    pairings: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      'x-field-style': 'pairing-food-list',
      'x-display-name': '위스키와 페어링할 음식',
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
          itemImageUrl: {
            type: 'string',
            maxLength: 2048,
            'x-field-style': 'image-upload',
            'x-upload-path': 'admin/curation',
            'x-display-name': '음식 이미지',
          },
        },
      },
    },
  },
} as const;

const alcoholItem = {
  source: 'BOTTLE_NOTE',
  alcohol: {
    alcoholId: 10,
    korName: '테스트 위스키',
    engName: 'Test Whisky',
    selectedTags: [],
  },
  comment: '추천합니다.',
};

describe('추천·페어링 큐레이션 스펙', () => {
  it('추천과 페어링 requestSpec의 배열 컨테이너 계약을 파싱한다', () => {
    expect(whiskyCurationRequestSpecSchema.safeParse(recommendedWhiskyRequestSpec).success).toBe(
      true
    );
    expect(whiskyCurationRequestSpecSchema.safeParse(whiskyPairingRequestSpec).success).toBe(true);
    expect(whiskyCurationRequestSpecSchema.parse(whiskyPairingRequestSpec)['x-form-style']).toBe(
      'pairing-list'
    );
  });

  it('payload는 위스키 항목 배열이며 페어링 음식도 함께 파싱한다', () => {
    expect(whiskyCurationPayloadSchema.safeParse([alcoholItem]).success).toBe(true);
    expect(
      whiskyCurationPayloadSchema.safeParse([
        {
          ...alcoholItem,
          pairings: [
            {
              itemName: '바닐라 아이스크림',
              pairingNote: '달콤한 바닐라 향과 잘 어울립니다.',
              itemImageUrl: 'https://cdn.example.com/pairing/icecream.jpg',
            },
          ],
        },
      ]).success
    ).toBe(true);
    expect(whiskyCurationPayloadSchema.safeParse({ alcohols: [alcoholItem] }).success).toBe(false);
  });

  it('기존 단건 상세 payload는 배열로 정규화한다', () => {
    const parsed = whiskyCurationDetailPayloadSchema.parse(alcoholItem);

    expect(parsed).toEqual([alcoholItem]);
  });

  it('페어링 이미지 필드가 없는 requestSpec도 파싱한다', () => {
    const requestSpec = {
      ...whiskyPairingRequestSpec,
      properties: {
        ...whiskyPairingRequestSpec.properties,
        pairings: {
          ...whiskyPairingRequestSpec.properties.pairings,
          items: {
            ...whiskyPairingRequestSpec.properties.pairings.items,
            properties: {
              itemName:
                whiskyPairingRequestSpec.properties.pairings.items.properties.itemName,
              pairingNote:
                whiskyPairingRequestSpec.properties.pairings.items.properties.pairingNote,
            },
          },
        },
      },
    };

    expect(whiskyCurationRequestSpecSchema.safeParse(requestSpec).success).toBe(true);
  });

  it('추천 section 객체가 원본 requestSpec과 라인업 안내를 관리한다', () => {
    const requestSpec = whiskyCurationRequestSpecSchema.parse(recommendedWhiskyRequestSpec);
    const sections = getRecommendedWhiskySections(requestSpec);
    const alcohols = sections.라인업.fields.alcohols;

    expect(alcohols.schema).toBe(requestSpec);
    expect(alcohols.schema.type).toBe('object');
    expect(alcohols.schema['x-container']).toBe('array');
    expect(sections.라인업.subtitle).toBe('큐레이션에 노출할 라인업을 입력해주세요.');
  });

  it('페어링 section 객체가 음식 필드 라벨과 안내 문구를 관리한다', () => {
    const requestSpec = whiskyCurationRequestSpecSchema.parse(whiskyPairingRequestSpec);
    const sections = getWhiskyPairingSections(requestSpec);
    const alcohols = sections.라인업.fields.alcohols;

    expect(alcohols.pairing.itemLabel).toBe('페어링 음식');
    expect(alcohols.pairing.addButtonLabel).toBe('페어링 음식 추가');
    expect(alcohols.pairing.fields.itemName?.label).toBe('음식명');
    expect(alcohols.pairing.fields.pairingNote?.label).toBe('페어링 설명');
    expect(alcohols.pairing.fields.itemImageUrl?.label).toBe('음식 이미지');
  });
});
