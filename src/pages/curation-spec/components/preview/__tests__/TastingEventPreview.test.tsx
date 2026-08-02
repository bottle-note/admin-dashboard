import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';

import { TastingEventPreview } from '../TastingEventPreview';
import type { TastingEventPreviewValues } from '../TastingEventPreview';

const tastingEventPreview: TastingEventPreviewValues = {
  name: '싱글몰트 시음회',
  description: '셰리 캐스크 중심의 시음회',
  imageUrls: [],
  eventDate: '2026-06-15',
  eventTime: '19:30',
  placeName: '도시남 바',
  barAddress: '서울 강남구 테헤란로 123',
  detailAddress: '2층',
  entryFee: 75000,
  is_tbc: false,
  capacity: 20,
  isRecruiting: true,
  applicationLink: 'https://forms.example.com/tasting',
  guideText: '시작 10분 전 입장해 주세요.',
  alcohols: [
    {
      source: 'MANUAL',
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
};

describe('TastingEventPreview', () => {
  it('위스키 설명의 개행을 미리보기에 적용한다', () => {
    render(<TastingEventPreview values={tastingEventPreview} today={new Date('2026-06-01')} />);

    expect(screen.getByText('첫 줄 설명 둘째 줄 설명')).toHaveClass('whitespace-pre-line');
  });

  it('모집 인원이 0명이면 미정으로 표시한다', () => {
    render(
      <TastingEventPreview
        values={{
          ...tastingEventPreview,
          capacity: 0,
        }}
        today={new Date('2026-06-01')}
      />
    );

    expect(screen.getAllByText('모집 인원 미정').length).toBeGreaterThan(0);
    expect(screen.queryByText('0명 정원')).not.toBeInTheDocument();
  });

  it('가격 미정이면 저장된 참가비보다 가격 미정 표시를 우선한다', () => {
    render(
      <TastingEventPreview
        values={{
          ...tastingEventPreview,
          entryFee: 75000,
          is_tbc: true,
        }}
        today={new Date('2026-06-01')}
      />
    );

    expect(screen.getByText('가격 미정')).toBeInTheDocument();
    expect(screen.queryByText('75,000원')).not.toBeInTheDocument();
  });
});
