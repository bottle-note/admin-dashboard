import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { CurationV2Spec, CurationV2UpdateRequest } from '@/types/api';

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
    required: [
      'eventDate',
      'eventTime',
      'barAddress',
      'entryFee',
      'capacity',
      'applicationLink',
      'guideText',
      'alcohols',
    ],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        description: '시음회 날짜',
        'x-display-name': '시음회 날짜',
      },
      eventTime: {
        type: 'string',
        description: '시음회 시간',
        'x-field-style': 'time',
        'x-display-name': '시음회 시간',
      },
      barAddress: {
        type: 'string',
        maxLength: 200,
        description: '장소 및 바 주소',
        'x-field-style': 'plain-text',
        'x-display-name': '장소 및 바(bar) 주소',
      },
      isRecruiting: {
        type: 'boolean',
        description: '시음회 참여자 모집 여부',
        'x-display-name': '참여자 모집 여부',
      },
      entryFee: {
        type: 'integer',
        minimum: 0,
        description: '참가비',
        'x-display-name': '참가비(1인당)',
      },
      capacity: {
        type: 'integer',
        minimum: 1,
        maximum: 999,
        description: '총 모집 인원수',
        'x-display-name': '총 모집 인원수',
      },
      applicationLink: {
        type: 'string',
        maxLength: 2048,
        description: '신청 링크',
        'x-field-style': 'plain-text',
        'x-display-name': '신청링크',
      },
      guideText: {
        type: 'string',
        maxLength: 1000,
        description: '시음회 안내사항',
        'x-field-style': 'long-text',
        'x-display-name': '안내사항',
      },
      alcohols: {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        description: '시음 위스키 라인업',
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
              'x-display-name': '위스키 기대평',
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

describe('CurationDetailPage', () => {
  it('시음회 큐레이션은 작성 폼에 기존 값을 채우고 수정 API로 저장한다', async () => {
    const user = userEvent.setup();
    let capturedBody: CurationV2UpdateRequest | null = null;

    server.use(
      http.get(`${CURATION_BASE}/:curationId`, ({ params }) => {
        expect(params.curationId).toBe('10');

        return HttpResponse.json(
          wrapApiResponse({
            id: 10,
            name: '6월 싱글몰트 시음회',
            description: null,
            coverImageUrl: 'https://cdn.example.com/cover.jpg',
            imageUrls: ['https://cdn.example.com/cover.jpg'],
            exposureStartDate: null,
            exposureEndDate: null,
            displayOrder: 1,
            isActive: true,
            createdAt: '2026-05-15T00:00:00',
            modifiedAt: '2026-05-16T00:00:00',
            spec: tastingEventSpec,
            payload: {
              eventDate: '2026-06-15',
              eventTime: '19:30',
              barAddress: '서울 강남구 테헤란로 123',
              isRecruiting: true,
              entryFee: 50000,
              capacity: 12,
              applicationLink: 'https://forms.example.com/tasting',
              guideText: '시작 10분 전 입장해 주세요.',
              alcohols: [
                {
                  source: 'MANUAL',
                  alcohol: {
                    korName: '글렌드로낙 12년',
                    engName: 'Glendronach 12',
                    abv: '43%',
                    volume: '700ml',
                    cask: 'Sherry cask',
                    regionName: 'Highland',
                    korCategory: '싱글몰트',
                    selectedTags: ['셰리', '달콤한'],
                  },
                  comment: '첫 잔으로 가볍게 시작하는 위스키',
                },
              ],
            },
          })
        );
      }),
      http.put(`${CURATION_BASE}/:curationId`, async ({ params, request }) => {
        expect(params.curationId).toBe('10');
        capturedBody = (await request.json()) as CurationV2UpdateRequest;

        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_UPDATED',
            message: '큐레이션이 수정되었습니다.',
            targetId: 10,
            responseAt: '2026-05-31T09:00:00',
          })
        );
      })
    );

    render(<CurationDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '시음회 수정' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('큐레이션명')).toHaveValue('6월 싱글몰트 시음회');
    expect(screen.getByLabelText('설명')).toHaveValue('');
    expect(screen.getByLabelText('노출 시작일')).toHaveValue('');
    expect(screen.getByLabelText('노출 종료일')).toHaveValue('');
    expect(screen.getByText('날짜 및 장소')).toBeInTheDocument();
    expect(screen.getByText('참가 정보')).toBeInTheDocument();
    expect(screen.getAllByText('시음 위스키').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('시음회 날짜')).toHaveValue('2026-06-15');
    expect(screen.getByLabelText('시음회 시간')).toHaveValue('19:30');
    expect(screen.getByLabelText('장소 및 바(bar) 주소')).toHaveValue('서울 강남구 테헤란로 123');
    expect(screen.getByLabelText('참가비(1인당)')).toHaveValue(50000);
    expect(screen.getByLabelText('총 모집 인원수')).toHaveValue(12);
    expect(screen.getByLabelText('신청링크')).toHaveValue('https://forms.example.com/tasting');
    expect(screen.getByLabelText('안내사항')).toHaveValue('시작 10분 전 입장해 주세요.');
    expect(screen.getByLabelText('1번 수동 위스키 한글명')).toHaveValue('글렌드로낙 12년');
    expect(screen.getAllByText('글렌드로낙 12년').length).toBeGreaterThan(0);
    expect(screen.getAllByText('셰리').length).toBeGreaterThan(0);
    expect(screen.getAllByText('달콤한').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('글렌드로낙 12년 기대평')).toHaveValue(
      '첫 잔으로 가볍게 시작하는 위스키'
    );

    await user.clear(screen.getByLabelText('안내사항'));
    await user.type(screen.getByLabelText('안내사항'), '수정된 안내사항');
    await user.click(screen.getByRole('button', { name: /수정/ }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      specId: 3,
      name: '6월 싱글몰트 시음회',
      description: null,
      imageUrls: ['https://cdn.example.com/cover.jpg'],
      exposureStartDate: null,
      exposureEndDate: null,
      displayOrder: 1,
      isActive: true,
      payload: {
        eventDate: '2026-06-15',
        eventTime: '19:30',
        barAddress: '서울 강남구 테헤란로 123',
        guideText: '수정된 안내사항',
        alcohols: [
          {
            source: 'MANUAL',
            alcohol: {
              alcoholId: null,
              korName: '글렌드로낙 12년',
              selectedTags: ['셰리', '달콤한'],
            },
            comment: '첫 잔으로 가볍게 시작하는 위스키',
          },
        ],
      },
    });
  });

  it('등록되지 않은 스펙도 requestSpec 순서대로 payload를 표시한다', async () => {
    server.use(
      http.get(`${CURATION_BASE}/:curationId`, ({ params }) => {
        expect(params.curationId).toBe('10');

        return HttpResponse.json(
          wrapApiResponse({
            id: 10,
            name: '커스텀 큐레이션',
            description: null,
            coverImageUrl: null,
            imageUrls: [],
            exposureStartDate: null,
            exposureEndDate: null,
            displayOrder: 3,
            isActive: false,
            createdAt: '2026-05-15T00:00:00',
            modifiedAt: '2026-05-16T00:00:00',
            spec: {
              id: 9,
              code: 'CUSTOM_PROMOTION',
              name: '커스텀 프로모션',
              description: null,
              hydratorKey: null,
              version: 1,
              isActive: true,
              requestSpec: {
                type: 'object',
                required: ['title', 'priority'],
                properties: {
                  title: {
                    type: 'string',
                    'x-display-name': '제목',
                  },
                  priority: {
                    type: 'integer',
                    'x-display-name': '우선순위',
                  },
                  enabled: {
                    type: 'boolean',
                    'x-display-name': '노출 여부',
                  },
                  metadata: {
                    type: 'object',
                    'x-display-name': '메타데이터',
                  },
                },
              },
              responseSpec: {
                type: 'object',
              },
            },
            payload: {
              title: '봄 프로모션',
              priority: 7,
              enabled: false,
              metadata: {
                channel: 'home',
              },
            },
          })
        );
      })
    );

    render(<CurationDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('커스텀 큐레이션')).toBeInTheDocument();
    });

    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByText('봄 프로모션')).toBeInTheDocument();
    expect(screen.getByText('우선순위')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('노출 여부')).toBeInTheDocument();
    expect(screen.getByText('아니요')).toBeInTheDocument();
    expect(screen.getByText('메타데이터')).toBeInTheDocument();
    expect(screen.getByText('channel')).toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });
});
