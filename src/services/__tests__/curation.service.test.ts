import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import type { CurationV2CreateRequest, CurationV2Spec } from '@/types/api';
import { curationService, resolveCurationSpecByCode } from '../curation.service';

const SPEC_BASE = '/admin/api/v2/curation-specs';
const CURATION_BASE = '/admin/api/v2/curations';

const mockTastingEventSpec: CurationV2Spec = {
  id: 3,
  code: 'WHISKY_TASTING_EVENT',
  name: '위스키 시음회',
  description: '시음회 날짜, 장소, 참가 정보와 시음 위스키 라인업',
  hydratorKey: 'alcohol',
  version: 1,
  isActive: true,
  requestSpec: {
    type: 'object',
    required: ['eventDate', 'eventTime'],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        'x-label': '시음회 날짜',
        'x-section': '시음회 정보',
      },
      eventTime: {
        type: 'string',
        format: 'time',
        'x-label': '시음회 시간',
        'x-section': '시음회 정보',
      },
    },
  },
  responseSpec: {
    type: 'object',
  },
};

const mockRecommendedSpec: CurationV2Spec = {
  ...mockTastingEventSpec,
  id: 1,
  code: 'RECOMMENDED_WHISKY',
  name: '추천 위스키',
};

const createRequest: CurationV2CreateRequest = {
  specId: 3,
  name: '6월 싱글몰트 시음회',
  description: '소규모 시음회',
  imageUrls: ['https://cdn.example.com/cover.jpg'],
  exposureStartDate: '2026-06-01',
  exposureEndDate: '2026-06-30',
  displayOrder: 1,
  isActive: true,
  payload: {
    eventDate: '2026-06-15',
    eventTime: '19:30',
  },
};

describe('curationService', () => {
  it('큐레이션 스펙 목록을 조회한다', async () => {
    server.use(
      http.get(SPEC_BASE, () => {
        return HttpResponse.json(wrapApiResponse([mockRecommendedSpec, mockTastingEventSpec]));
      })
    );

    const result = await curationService.listSpecs();

    expect(result).toHaveLength(2);
    expect(result[1]!.code).toBe('WHISKY_TASTING_EVENT');
    expect(result[1]!.requestSpec.properties?.eventDate?.['x-label']).toBe('시음회 날짜');
  });

  it('큐레이션 스펙 상세를 조회한다', async () => {
    let capturedPath = '';

    server.use(
      http.get(`${SPEC_BASE}/:specId`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        return HttpResponse.json(wrapApiResponse(mockTastingEventSpec));
      })
    );

    const result = await curationService.getSpec(3);

    expect(capturedPath).toBe('/admin/api/v2/curation-specs/3');
    expect(result.id).toBe(3);
  });

  it('specCode로 스펙을 resolve한다', () => {
    const result = resolveCurationSpecByCode(
      [mockRecommendedSpec, mockTastingEventSpec],
      'WHISKY_TASTING_EVENT'
    );

    expect(result?.id).toBe(3);
  });

  it('존재하지 않는 specCode는 null을 반환한다', () => {
    const result = resolveCurationSpecByCode([mockRecommendedSpec], 'WHISKY_TASTING_EVENT');

    expect(result).toBeNull();
  });

  it('spec 기반 큐레이션 목록을 조회한다', async () => {
    server.use(
      http.get(CURATION_BASE, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('isActive')).toBe('true');
        expect(url.searchParams.get('page')).toBe('0');

        return HttpResponse.json(
          wrapApiResponse(
            [
              {
                id: 10,
                specId: 3,
                specCode: 'WHISKY_TASTING_EVENT',
                name: '6월 싱글몰트 시음회',
                displayOrder: 1,
                isActive: true,
                createdAt: '2026-05-15T00:00:00',
              },
            ],
            {
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              hasNext: false,
            }
          )
        );
      })
    );

    const result = await curationService.list({ isActive: true, page: 0, size: 20 });

    expect(result.items[0]!.specCode).toBe('WHISKY_TASTING_EVENT');
    expect(result.meta.totalElements).toBe(1);
  });

  it('spec 기반 큐레이션 상세를 조회한다', async () => {
    server.use(
      http.get(`${CURATION_BASE}/:curationId`, () => {
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
            spec: mockTastingEventSpec,
            payload: {
              eventDate: '2026-06-15',
            },
          })
        );
      })
    );

    const result = await curationService.getDetail(10);

    expect(result.spec.code).toBe('WHISKY_TASTING_EVENT');
    expect(result.payload.eventDate).toBe('2026-06-15');
  });

  it('spec 기반 큐레이션 생성 요청을 전송한다', async () => {
    let capturedBody: CurationV2CreateRequest | null = null;

    server.use(
      http.post(CURATION_BASE, async ({ request }) => {
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_CREATED',
            message: '큐레이션이 등록되었습니다.',
            targetId: 10,
            responseAt: '2026-05-23 09:18:33',
          })
        );
      })
    );

    const result = await curationService.create(createRequest);

    expect(capturedBody).toMatchObject({
      specId: 3,
      imageUrls: ['https://cdn.example.com/cover.jpg'],
      payload: {
        eventDate: '2026-06-15',
      },
    });
    expect(result.targetId).toBe(10);
  });

  it('spec 기반 큐레이션 수정 요청을 전송한다', async () => {
    let capturedPath = '';
    let capturedBody: CurationV2CreateRequest | null = null;

    server.use(
      http.put(`${CURATION_BASE}/:curationId`, async ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        capturedBody = (await request.json()) as CurationV2CreateRequest;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'CURATION_UPDATED',
            message: '큐레이션이 수정되었습니다.',
            targetId: 10,
            responseAt: '2026-05-23 09:18:33',
          })
        );
      })
    );

    const result = await curationService.update(10, {
      ...createRequest,
      name: '수정된 시음회',
    });

    expect(capturedPath).toBe('/admin/api/v2/curations/10');
    expect(capturedBody).toMatchObject({ name: '수정된 시음회', specId: 3 });
    expect(result.code).toBe('CURATION_UPDATED');
  });
});
