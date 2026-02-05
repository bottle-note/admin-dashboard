import { http, HttpResponse } from 'msw';
import {
  mockTastingTagListItems,
  mockTastingTagDetail,
  mockFormResponse,
  mockDeleteResponse,
  mockAlcoholConnectionResponse,
  mockAlcoholDisconnectionResponse,
  wrapApiResponse,
} from './data';

const BASE = '/admin/api/v1/tasting-tags';

export const tastingTagHandlers = [
  // GET 목록
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockTastingTagListItems;
    if (keyword) {
      items = items.filter(
        (t) => t.korName.includes(keyword) || t.engName.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    return HttpResponse.json(
      wrapApiResponse(items, {
        page,
        size,
        totalElements: items.length,
        totalPages: Math.ceil(items.length / size),
        hasNext: false,
      })
    );
  }),

  // GET 상세
  http.get(`${BASE}/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === mockTastingTagDetail.tag.id) {
      return HttpResponse.json(wrapApiResponse(mockTastingTagDetail));
    }
    return HttpResponse.json(
      {
        success: false,
        code: 404,
        data: null,
        errors: [{ code: 'TASTING_TAG_NOT_FOUND', message: '태그를 찾을 수 없습니다.' }],
        meta: {},
      },
      { status: 404 }
    );
  }),

  // POST 생성
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockFormResponse,
        code: 'TASTING_TAG_CREATED',
        targetId: 99,
        message: `${body.korName} 태그가 생성되었습니다.`,
      })
    );
  }),

  // PUT 수정
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockFormResponse,
        code: 'TASTING_TAG_UPDATED',
        targetId: Number(params.id),
        message: `${body.korName} 태그가 수정되었습니다.`,
      })
    );
  }),

  // DELETE 삭제
  http.delete(`${BASE}/:id`, ({ params, request }) => {
    // 연관 위스키 해제 API와 구분 (alcohols path 없는 경우만)
    const url = new URL(request.url);
    if (url.pathname.endsWith('/alcohols')) return;

    return HttpResponse.json(
      wrapApiResponse({
        ...mockDeleteResponse,
        targetId: Number(params.id),
      })
    );
  }),

  // POST 위스키 연결
  http.post(`${BASE}/:id/alcohols`, async ({ params, request }) => {
    const body = (await request.json()) as { alcoholIds: number[] };
    return HttpResponse.json(
      wrapApiResponse({
        ...mockAlcoholConnectionResponse,
        targetId: Number(params.id),
        message: `${body.alcoholIds.length}개 위스키가 연결되었습니다.`,
      })
    );
  }),

  // DELETE 위스키 연결 해제
  http.delete(`${BASE}/:id/alcohols`, async ({ params, request }) => {
    const body = (await request.json()) as { alcoholIds: number[] };
    return HttpResponse.json(
      wrapApiResponse({
        ...mockAlcoholDisconnectionResponse,
        targetId: Number(params.id),
        message: `${body.alcoholIds.length}개 위스키 연결이 해제되었습니다.`,
      })
    );
  }),
];

export const handlers = [...tastingTagHandlers];
