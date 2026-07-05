import { describe, expect, it } from 'vitest';

import { createWhiskyTastingEventPreviewModel } from '../whisky-tasting-event.preview-model';
import type { WhiskyTastingEventFormState } from '../whisky-tasting-event.schema';

describe('createWhiskyTastingEventPreviewModel', () => {
  it('작성 중인 시음회 form 값을 앱 상세 미리보기 데이터로 변환한다', () => {
    const preview = createWhiskyTastingEventPreviewModel({
      name: ' 6월 싱글몰트 시음회 ',
      description: ' 셰리 캐스크 중심의 시음회 ',
      imageUrls: ['https://img.example.com/main.png', 'https://img.example.com/sub.png'],
      exposureStartDate: '2026-06-01',
      exposureEndDate: '2026-06-30',
      displayOrder: 0,
      isActive: true,
      eventDate: '2026-06-15',
      eventTime: '19:30',
      placeName: '도시남 바',
      barAddress: '서울 강남구',
      detailAddress: '2층',
      isRecruiting: true,
      entryFee: 50000,
      capacity: 12,
      applicationLink: ' https://forms.example.com/tasting ',
      guideText: '시작 10분 전 입장해 주세요.',
      alcohols: [
        {
          source: 'MANUAL',
          alcohol: {
            alcoholId: null,
            korName: ' 글렌드로낙 12년 ',
            engName: 'Glendronach 12',
            imageUrl: 'img.example.com/whisky.png',
            abv: '43',
            cask: '셰리 캐스크',
            volume: '700ml',
            regionName: '하이랜드',
            korCategory: '싱글 몰트',
            selectedTags: [' 달콤한 ', '묵직한'],
          },
          comment: ' 첫 잔으로 소개합니다. ',
        },
      ],
    } satisfies WhiskyTastingEventFormState);

    expect(preview).toMatchObject({
      name: '6월 싱글몰트 시음회',
      description: '셰리 캐스크 중심의 시음회',
      coverImageUrl: 'https://img.example.com/main.png',
      imageUrls: ['https://img.example.com/main.png', 'https://img.example.com/sub.png'],
      payload: {
        eventDate: '2026-06-15',
        eventTime: '19:30',
        placeName: '도시남 바',
        barAddress: '서울 강남구',
        detailAddress: '2층',
        entryFee: 50000,
        capacity: 12,
        isRecruiting: true,
        applicationLink: 'https://forms.example.com/tasting',
        guideText: '시작 10분 전 입장해 주세요.',
      },
    });
    expect(preview.payload.alcohols?.[0]).toMatchObject({
      source: 'MANUAL-0',
      comment: '첫 잔으로 소개합니다.',
      alcohol: {
        alcoholId: null,
        korName: '글렌드로낙 12년',
        engName: 'Glendronach 12',
        imageUrl: 'https://img.example.com/whisky.png',
        abv: '43',
        regionName: '하이랜드',
        korCategory: '싱글 몰트',
        selectedTags: ['달콤한', '묵직한'],
      },
    });
  });
});
