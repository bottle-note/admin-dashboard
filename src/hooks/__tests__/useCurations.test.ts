import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { renderHook } from '@/test/test-utils';
import {
  cacheCurationSpecDetail,
  getCachedCurationSpecDetail,
  readCurationSpecBrowserCache,
  writeCurationSpecBrowserCache,
} from '@/lib/curation-spec-browser-cache';
import { useAuthStore } from '@/stores/auth';
import type { CurationV2CreateRequest, CurationV2Spec, CurationV2SpecListItem } from '@/types/api';
import { useCurationSpecFormModel } from '@/pages/curation/useCurationSpecFormModel';
import {
  useCurationCreate,
  useCurationList,
  useCurationSpec,
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

const ADMIN_ID = 7;

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAuthStore.setState({
      user: { adminId: ADMIN_ID, email: 'admin@example.com', roles: ['ROOT_ADMIN'] },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      isAuthenticated: true,
    });
  });
});

describe('useCurations hooks', () => {
  it('fresh browser manifest를 목록 API 호출 없이 사용한다', async () => {
    let listRequestCount = 0;
    server.use(
      http.get(SPEC_BASE, () => {
        listRequestCount++;
        return HttpResponse.json(wrapApiResponse([mockTastingEventSpecListItem]));
      })
    );

    writeCurationSpecBrowserCache(ADMIN_ID, {
      schemaVersion: 1,
      checkedAt: Date.now(),
      specs: [mockTastingEventSpecListItem],
      details: {},
    });

    const { result } = renderHook(() => useCurationSpecs());

    await waitFor(() => expect(result.current.data?.[0]?.version).toBe(1));
    expect(listRequestCount).toBe(0);
  });

  it('stale manifest 확인 후 version이 바뀐 detail cache를 제거한다', async () => {
    const staleCache = cacheCurationSpecDetail(
      {
        schemaVersion: 1,
        checkedAt: Date.now() - 1000 * 60 * 60 - 1,
        specs: [mockTastingEventSpecListItem],
        details: {},
      },
      mockTastingEventSpec,
      Date.now() - 1000 * 60 * 60 - 1
    );
    writeCurationSpecBrowserCache(ADMIN_ID, staleCache);

    server.use(
      http.get(SPEC_BASE, () =>
        HttpResponse.json(wrapApiResponse([{ ...mockTastingEventSpecListItem, version: 2 }]))
      )
    );

    const { result } = renderHook(() => useCurationSpecs());

    await waitFor(() => expect(result.current.data?.[0]?.version).toBe(2));

    const cache = readCurationSpecBrowserCache(ADMIN_ID);
    expect(getCachedCurationSpecDetail(cache, mockTastingEventSpec.id, 1)).toBeNull();
  });

  it('matching browser detail을 재사용하고 detail API를 호출하지 않는다', async () => {
    let detailRequestCount = 0;
    server.use(
      http.get(`${SPEC_BASE}/:specId`, () => {
        detailRequestCount++;
        return HttpResponse.json(wrapApiResponse(mockTastingEventSpec));
      })
    );

    const cache = cacheCurationSpecDetail(
      {
        schemaVersion: 1,
        checkedAt: Date.now(),
        specs: [mockTastingEventSpecListItem],
        details: {},
      },
      mockTastingEventSpec,
      Date.now()
    );
    writeCurationSpecBrowserCache(ADMIN_ID, cache);

    const { result } = renderHook(() => useCurationSpec(mockTastingEventSpec.id, 1));

    await waitFor(() => expect(result.current.data?.id).toBe(mockTastingEventSpec.id));
    expect(detailRequestCount).toBe(0);
  });

  it('detail cache miss 시 응답 schema를 browser cache에 저장한다', async () => {
    server.use(
      http.get(`${SPEC_BASE}/:specId`, () =>
        HttpResponse.json(wrapApiResponse(mockTastingEventSpec))
      )
    );

    const { result } = renderHook(() => useCurationSpec(mockTastingEventSpec.id, 1));

    await waitFor(() => expect(result.current.data?.id).toBe(mockTastingEventSpec.id));

    const cache = readCurationSpecBrowserCache(ADMIN_ID);
    expect(getCachedCurationSpecDetail(cache, mockTastingEventSpec.id, 1)?.data).toEqual(
      mockTastingEventSpec
    );
  });

  it('form model이 canonical 목록 query를 재사용한다', async () => {
    let listRequestCount = 0;
    server.use(
      http.get(SPEC_BASE, () => {
        listRequestCount++;
        return HttpResponse.json(wrapApiResponse([mockTastingEventSpecListItem]));
      }),
      http.get(`${SPEC_BASE}/:specId`, () =>
        HttpResponse.json(wrapApiResponse(mockTastingEventSpec))
      )
    );

    const { result } = renderHook(() => {
      const specsQuery = useCurationSpecs();
      const formModel = useCurationSpecFormModel({
        specCode: 'WHISKY_TASTING_EVENT',
        createFormModel: (spec) => spec.id,
      });

      return { specsQuery, formModel };
    });

    await waitFor(() => expect(result.current.formModel.formModel).toBe(mockTastingEventSpec.id));
    expect(listRequestCount).toBe(1);
  });

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
