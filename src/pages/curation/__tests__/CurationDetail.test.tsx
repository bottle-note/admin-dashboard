import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { CurationV2Spec } from '@/types/api';

import { CurationDetailPage } from '../CurationDetail';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '10' }),
  };
});

const CURATION_BASE = '/admin/api/v2/curations';

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
    required: ['eventDate', 'eventTime', 'barAddress', 'alcohols'],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        'x-display-name': '시음회 날짜',
      },
      eventTime: {
        type: 'string',
        'x-field-style': 'time',
        'x-display-name': '시음회 시간',
      },
      barAddress: {
        type: 'string',
        'x-field-style': 'plain-text',
        'x-display-name': '장소 및 바(bar) 주소',
      },
      alcohols: {
        type: 'array',
        'x-field-style': 'alcohol-card-list',
        'x-display-name': '시음 위스키',
      },
    },
  },
  responseSpec: {
    type: 'object',
  },
};

describe('CurationDetailPage', () => {
  it('spec 기반 큐레이션 상세와 payload를 표시한다', async () => {
    server.use(
      http.get(`${CURATION_BASE}/:curationId`, ({ params }) => {
        expect(params.curationId).toBe('10');

        return HttpResponse.json(
          wrapApiResponse({
            id: 10,
            name: '6월 싱글몰트 시음회',
            description: '소규모 시음회',
            coverImageUrl: 'https://cdn.example.com/cover.jpg',
            imageUrls: ['https://cdn.example.com/cover.jpg'],
            exposureStartDate: '2026-06-01',
            exposureEndDate: '2026-06-30',
            displayOrder: 1,
            isActive: true,
            createdAt: '2026-05-15T00:00:00',
            modifiedAt: '2026-05-16T00:00:00',
            spec: tastingEventSpec,
            payload: {
              eventDate: '2026-06-15',
              eventTime: '19:30',
              barAddress: '서울 강남구 테헤란로 123',
              alcohols: [
                {
                  source: 'MANUAL',
                  alcohol: {
                    korName: '글렌드로낙 12년',
                    selectedTags: ['셰리', '달콤한'],
                  },
                },
              ],
            },
          })
        );
      })
    );

    render(<CurationDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('6월 싱글몰트 시음회')).toBeInTheDocument();
    });

    expect(screen.getByText('위스키 시음회')).toBeInTheDocument();
    expect(screen.getByText('시음회 날짜')).toBeInTheDocument();
    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('장소 및 바(bar) 주소')).toBeInTheDocument();
    expect(screen.getByText('서울 강남구 테헤란로 123')).toBeInTheDocument();
    expect(screen.getByText('글렌드로낙 12년')).toBeInTheDocument();
  });
});
