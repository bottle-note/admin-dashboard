import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';

import { TastingEventPreview } from '../TastingEventPreview';
import type { TastingEventPreviewData } from '../types';

const tastingEventPreview: TastingEventPreviewData = {
  name: '싱글몰트 시음회',
  description: '셰리 캐스크 중심의 시음회',
  coverImageUrl: '',
  imageUrls: [],
  payload: {
    eventDate: '2026-06-15',
    eventTime: '19:30',
    placeName: '도시남 바',
    barAddress: '서울 강남구 테헤란로 123',
    detailAddress: '2층',
    entryFee: 75000,
    capacity: 20,
    isRecruiting: true,
    applicationLink: 'https://forms.example.com/tasting',
    guideText: '시작 10분 전 입장해 주세요.',
    alcohols: [
      {
        source: 'MANUAL-0',
        alcohol: {
          alcoholId: null,
          korName: '글렌드로낙 12년',
          engName: 'Glendronach 12',
          imageUrl: '',
          abv: '43',
          selectedTags: ['셰리'],
        },
        comment: '첫 줄 설명\n둘째 줄 설명',
      },
    ],
  },
};

describe('TastingEventPreview', () => {
  it('위스키 설명의 개행을 미리보기에 적용한다', () => {
    render(<TastingEventPreview event={tastingEventPreview} today={new Date('2026-06-01')} />);

    expect(screen.getByText('첫 줄 설명 둘째 줄 설명')).toHaveClass('whitespace-pre-line');
  });
});
