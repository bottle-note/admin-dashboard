import { describe, expect, it } from 'vitest';

import { createTastingEventPreviewModel } from '../tasting-event.preview-model';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

describe('createTastingEventPreviewModel', () => {
  it('작성 중인 시음회 form 값을 앱 노출 미리보기 모델로 변환한다', () => {
    const preview = createTastingEventPreviewModel({
      name: ' 6월 싱글몰트 시음회 ',
      description: ' 셰리 캐스크 중심의 시음회 ',
      imageUrls: ['https://img.example.com/main.png', 'https://img.example.com/sub.png'],
      exposureStartDate: '2026-06-01',
      exposureEndDate: '2026-06-30',
      displayOrder: 0,
      isActive: true,
      eventDate: '2026-06-15',
      eventTime: '19:30',
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
            imageUrl: 'https://img.example.com/whisky.png',
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
    } satisfies TastingEventCreateFormState);

    expect(preview).toMatchObject({
      title: '6월 싱글몰트 시음회',
      description: '셰리 캐스크 중심의 시음회',
      imageUrl: 'https://img.example.com/main.png',
      imageCount: 2,
      scheduleLabel: '2026.06.15 19:30',
      locationLabel: '서울 강남구 2층',
      entryFeeLabel: '50,000원',
      capacityLabel: '12명',
      recruitingLabel: '참여자 모집 중',
      applicationLink: 'https://forms.example.com/tasting',
      guideText: '시작 10분 전 입장해 주세요.',
    });
    expect(preview.whiskies[0]).toMatchObject({
      name: '글렌드로낙 12년',
      tags: ['달콤한', '묵직한'],
      comment: '첫 잔으로 소개합니다.',
      meta: ['43%', '700ml', '셰리 캐스크', '하이랜드', '싱글 몰트'],
    });
  });
});
