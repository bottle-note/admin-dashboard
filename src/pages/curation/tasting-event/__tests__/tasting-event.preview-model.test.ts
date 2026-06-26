import { describe, expect, it } from 'vitest';

import { createTastingEventPreviewModel } from '../tasting-event.preview-model';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

describe('createTastingEventPreviewModel', () => {
  it('작성 중인 시음회 form 값을 앱 노출 미리보기 모델로 변환한다', () => {
    const preview = createTastingEventPreviewModel({
      name: ' 6월 싱글몰트 시음회 ',
      description: ' 셰리 캐스크 중심의 시음회\n두 번째 줄 안내 ',
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
    } satisfies TastingEventCreateFormState, {
      today: new Date(2026, 5, 1),
    });

    expect(preview).toMatchObject({
      title: '6월 싱글몰트 시음회',
      description: '셰리 캐스크 중심의 시음회\n두 번째 줄 안내',
      coverImageUrl: 'https://img.example.com/main.png',
      imageUrls: ['https://img.example.com/sub.png'],
      imageUrl: 'https://img.example.com/main.png',
      imageCount: 2,
      eventDateLabel: '6월 15일 (월)',
      eventTimeLabel: '19:30',
      eventDateTimeLabel: '6월 15일 (월) · 19:30',
      placeLabel: '도시남 바',
      fullAddress: '서울 강남구 2층',
      mapSearchUrl: 'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%EA%B0%95%EB%82%A8%EA%B5%AC%202%EC%B8%B5',
      scheduleLabel: '2026.06.15 19:30',
      locationLabel: '도시남 바 서울 강남구 2층',
      entryFeeLabel: '50,000원',
      capacityLabel: '12명 정원',
      recruitingLabel: '참여자 모집 중',
      applicationLink: 'https://forms.example.com/tasting',
      guideText: '시작 10분 전 입장해 주세요.',
      cta: {
        type: 'apply',
        label: '시음회 신청하기',
        href: 'https://forms.example.com/tasting',
      },
    });
    expect(preview.alcohols[0]).toMatchObject({
      id: 'MANUAL-0',
      alcohol: {
        korName: '글렌드로낙 12년',
        engName: 'Glendronach 12',
        imageUrl: 'https://img.example.com/whisky.png',
        abv: '43%',
        volume: '700ml',
        cask: '셰리 캐스크',
        regionName: '하이랜드',
        korCategory: '싱글 몰트',
        selectedTags: ['달콤한', '묵직한'],
      },
      comment: '첫 잔으로 소개합니다.',
    });
    expect(preview.whiskies[0]).toMatchObject({
      name: '글렌드로낙 12년',
      imageUrl: 'https://img.example.com/whisky.png',
      tags: ['달콤한', '묵직한'],
      comment: '첫 잔으로 소개합니다.',
      meta: ['43%', '700ml', '셰리 캐스크', '하이랜드', '싱글 몰트'],
    });
  });

  it('신청 링크와 모집 상태에 따라 CTA를 숨김 또는 마감 상태로 변환한다', () => {
    const baseValues = {
      name: '마감 테스트',
      description: '설명',
      imageUrls: [],
      exposureStartDate: '2026-06-01',
      exposureEndDate: '2026-06-30',
      displayOrder: 0,
      isActive: true,
      eventDate: '2026-06-15',
      eventTime: '19:30',
      placeName: '',
      barAddress: '',
      detailAddress: '',
      isRecruiting: true,
      entryFee: 0,
      capacity: 0,
      applicationLink: '',
      guideText: '',
      alcohols: [],
    } satisfies TastingEventCreateFormState;

    expect(
      createTastingEventPreviewModel(baseValues, {
        today: new Date(2026, 5, 1),
      }).cta
    ).toEqual({ type: 'hidden' });

    expect(
      createTastingEventPreviewModel(
        {
          ...baseValues,
          applicationLink: 'https://forms.example.com/tasting',
          eventDate: '2026-05-31',
        },
        {
          today: new Date(2026, 5, 1),
        }
      ).cta
    ).toEqual({ type: 'closed', label: '모집 마감' });
  });
});
