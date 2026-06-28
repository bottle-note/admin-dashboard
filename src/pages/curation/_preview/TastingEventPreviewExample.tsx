import { TastingEventPreview } from './TastingEventPreview';
import type { TastingEventPreviewData } from './types';

const exampleEvent: TastingEventPreviewData = {
  name: '보틀노트 프라이빗 시음회',
  description:
    '보틀노트가 엄선한 위스키 라인업을 한자리에서 경험해보세요.\n각 제품의 향과 맛을 비교하며 취향에 맞는 위스키를 찾아볼 수 있습니다.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=80',
  imageUrls: [
    'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=1200&q=80',
  ],
  payload: {
    capacity: 20,
    entryFee: 30000,
    eventDate: '2026-07-18',
    eventTime: '19:30',
    guideText: '행사 시작 10분 전까지 도착해주세요.',
    placeName: '보틀노트 라운지',
    barAddress: '서울 강남구 테헤란로 123',
    detailAddress: '4층',
    isRecruiting: true,
    applicationLink: 'https://example.com/tasting-event/apply',
    alcohols: [
      {
        source: 'admin-preview-1',
        stats: {
          rating: 3.5,
          totalRatingsCount: 16,
        },
        alcohol: {
          alcoholId: 1,
          korName: '글렌드로낙 오리지널 12Y',
          engName: 'Glendronach Original 12Y',
          imageUrl:
            'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80',
          korCategory: '싱글몰트 위스키',
          regionName: '하이랜드',
          selectedTags: ['건자두', '생강', '스파이시', '흙', '비빔밥'],
          abv: '42',
        },
        comment:
          '더블 캐스크의 밸런스. 셰리와 버번이 얼마나 부드러운지, 동해물과 백두산이 마르고 닳도록 캡발타운 보우하사.',
      },
    ],
  },
};

export function TastingEventPreviewExample() {
  return <TastingEventPreview event={exampleEvent} today={new Date()} />;
}
