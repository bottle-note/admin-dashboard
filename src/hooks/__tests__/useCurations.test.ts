import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { renderHook } from '@/test/test-utils';
import type {
  CurationV2CreateRequest,
  CurationV2Spec,
  CurationV2SpecListItem,
} from '@/types/api';
import {
  useCurationCreate,
  useCurationList,
  useCurationSpecByCode,
  useCurationSpecs,
  useCurationUpdate,
} from '../useCurations';

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
    required: ['eventDate'],
    properties: {
      eventDate: {
        type: 'string',
        format: 'date',
        'x-label': '시음회 날짜',
      },
    },
  },
  responseSpec: {
    type: 'object',
  },
};

const mockTastingEventSpecListItem: CurationV2SpecListItem = {
  id: mockTastingEventSpec.id,
  code: mockTastingEventSpec.code,
  name: mockTastingEventSpec.name,
  description: mockTastingEventSpec.description,
  version: mockTastingEventSpec.version,
  isActive: mockTastingEventSpec.isActive,
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
  },
};

describe('useCurations hooks', () => {
  it('큐레이션 스펙 목록을 반환한다', async () => {
    server.use(
      http.get(SPEC_BASE, () => {
        return HttpResponse.json(wrapApiResponse([mockTastingEventSpecListItem]));
      })
    );

    const { result } = renderHook(() => useCurationSpecs());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0]!.code).toBe('WHISKY_TASTING_EVENT');
  });

  it('specCode로 큐레이션 스펙을 resolve한다', async () => {
    server.use(
      http.get(SPEC_BASE, () => {
        return HttpResponse.json(wrapApiResponse([mockTastingEventSpecListItem]));
      })
    );

    const { result } = renderHook(() => useCurationSpecByCode('WHISKY_TASTING_EVENT'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(3);
  });

  it('존재하지 않는 specCode는 null로 반환한다', async () => {
    server.use(
      http.get(SPEC_BASE, () => {
        return HttpResponse.json(wrapApiResponse([mockTastingEventSpecListItem]));
      })
    );

    const { result } = renderHook(() => useCurationSpecByCode('UNKNOWN_SPEC'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('spec 기반 큐레이션 목록을 반환한다', async () => {
    server.use(
      http.get(CURATION_BASE, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('code')).toBe('RECOMMENDED_WHISKY');
        expect(url.searchParams.get('isActive')).toBe('true');

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

    const { result } = renderHook(() =>
      useCurationList({ code: 'RECOMMENDED_WHISKY', isActive: true, page: 0, size: 20 })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.items[0]!.specCode).toBe('WHISKY_TASTING_EVENT');
  });

  it('spec 기반 큐레이션 생성 mutation이 성공한다', async () => {
    const onSuccess = vi.fn();
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

    const { result } = renderHook(() => useCurationCreate({ onSuccess }));

    result.current.mutate(createRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toMatchObject({
      specId: 3,
      payload: {
        eventDate: '2026-06-15',
      },
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('spec 기반 큐레이션 수정 mutation이 성공한다', async () => {
    const onSuccess = vi.fn();
    let capturedPath = '';

    server.use(
      http.put(`${CURATION_BASE}/:curationId`, ({ request }) => {
        capturedPath = new URL(request.url).pathname;
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

    const { result } = renderHook(() => useCurationUpdate({ onSuccess }));

    result.current.mutate({
      curationId: 10,
      data: {
        ...createRequest,
        name: '수정된 시음회',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedPath).toBe('/admin/api/v2/curations/10');
    expect(onSuccess).toHaveBeenCalled();
  });
});
