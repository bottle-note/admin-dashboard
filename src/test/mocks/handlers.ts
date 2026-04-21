import { http, HttpResponse } from 'msw';
import {
  mockTastingTagListItems,
  mockTastingTagDetail,
  mockFormResponse,
  mockDeleteResponse,
  mockAlcoholConnectionResponse,
  mockAlcoholDisconnectionResponse,
  mockAlcoholListItems,
  mockAlcoholDeleteResponse,
  mockCategoryReferences,
  mockBannerListItems,
  mockBannerDetail,
  mockBannerCreateResponse,
  mockBannerUpdateResponse,
  mockBannerDeleteResponse,
  mockBannerUpdateStatusResponse,
  mockBannerUpdateSortOrderResponse,
  mockUserListItems,
  mockDistilleryListItems,
  mockDistilleryDetail,
  mockDistilleryFormResponse,
  mockDistilleryDeleteResponse,
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

// ============================================
// Banner Handlers
// ============================================

const BANNER_BASE = '/admin/api/v1/banners';

export const bannerHandlers = [
  // GET 목록
  http.get(BANNER_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const bannerType = url.searchParams.get('bannerType');
    const isActive = url.searchParams.get('isActive');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockBannerListItems;
    if (keyword) {
      items = items.filter((b) => b.name.includes(keyword));
    }
    if (bannerType) {
      items = items.filter((b) => b.bannerType === bannerType);
    }
    if (isActive !== null && isActive !== '') {
      items = items.filter((b) => b.isActive === (isActive === 'true'));
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

  // PATCH 상태 변경 (상세보다 먼저 매칭되도록)
  http.patch(`${BANNER_BASE}/:bannerId/status`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockBannerUpdateStatusResponse,
        targetId: Number(params.bannerId),
      })
    );
  }),

  // PATCH 정렬순서 변경
  http.patch(`${BANNER_BASE}/:bannerId/sort-order`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockBannerUpdateSortOrderResponse,
        targetId: Number(params.bannerId),
      })
    );
  }),

  // GET 상세
  http.get(`${BANNER_BASE}/:bannerId`, ({ params }) => {
    const id = Number(params.bannerId);
    if (id === mockBannerDetail.id) {
      return HttpResponse.json(wrapApiResponse(mockBannerDetail));
    }
    return HttpResponse.json(
      {
        success: false,
        code: 404,
        data: null,
        errors: [{ code: 'BANNER_NOT_FOUND', message: '배너를 찾을 수 없습니다.' }],
        meta: {},
      },
      { status: 404 }
    );
  }),

  // POST 생성
  http.post(BANNER_BASE, () => {
    return HttpResponse.json(
      wrapApiResponse(mockBannerCreateResponse)
    );
  }),

  // PUT 수정
  http.put(`${BANNER_BASE}/:bannerId`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockBannerUpdateResponse,
        targetId: Number(params.bannerId),
      })
    );
  }),

  // DELETE 삭제
  http.delete(`${BANNER_BASE}/:bannerId`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockBannerDeleteResponse,
        targetId: Number(params.bannerId),
      })
    );
  }),
];

// ============================================
// Alcohol Handlers
// ============================================

const ALCOHOL_BASE = '/admin/api/v1/alcohols';

export const alcoholHandlers = [
  // GET 카테고리 레퍼런스 (목록보다 먼저 매칭되도록)
  http.get(`${ALCOHOL_BASE}/categories/reference`, () => {
    return HttpResponse.json(wrapApiResponse(mockCategoryReferences));
  }),

  // GET 목록
  http.get(ALCOHOL_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const category = url.searchParams.get('category');
    const includeDeleted = url.searchParams.get('includeDeleted');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockAlcoholListItems;

    // 기본: 삭제된 데이터 제외
    if (includeDeleted !== 'true') {
      items = items.filter((item) => item.deletedAt === null);
    }

    if (keyword) {
      items = items.filter(
        (item) =>
          item.korName.includes(keyword) ||
          item.engName.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (category) {
      items = items.filter((item) => item.engCategoryName.toUpperCase().replace(' ', '_') === category);
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

  // DELETE 삭제
  http.delete(`${ALCOHOL_BASE}/:alcoholId`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockAlcoholDeleteResponse,
        targetId: Number(params.alcoholId),
      })
    );
  }),
];

// ============================================
// User Handlers
// ============================================

const USER_BASE = '/admin/api/v1/users';

export const userHandlers = [
  // GET 목록
  http.get(USER_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const status = url.searchParams.get('status');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockUserListItems;
    if (keyword) {
      items = items.filter(
        (u) => u.nickName.includes(keyword) || u.email.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (status) {
      items = items.filter((u) => u.status === status);
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
];

// ============================================
// Distillery Handlers
// ============================================

const DISTILLERY_BASE = '/admin/api/v1/distilleries';

export const distilleryHandlers = [
  // GET 목록
  http.get(DISTILLERY_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockDistilleryListItems;
    if (keyword) {
      items = items.filter(
        (d) => d.korName.includes(keyword) || d.engName.toLowerCase().includes(keyword.toLowerCase())
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
  http.get(`${DISTILLERY_BASE}/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === mockDistilleryDetail.id) {
      return HttpResponse.json(wrapApiResponse(mockDistilleryDetail));
    }
    return HttpResponse.json(
      {
        success: false,
        code: 404,
        data: null,
        errors: [{ code: 'DISTILLERY_NOT_FOUND', message: '증류소를 찾을 수 없습니다.' }],
        meta: {},
      },
      { status: 404 }
    );
  }),

  // POST 생성
  http.post(DISTILLERY_BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockDistilleryFormResponse,
        code: 'DISTILLERY_CREATED',
        targetId: 99,
        message: `${body.korName} 증류소가 생성되었습니다.`,
      })
    );
  }),

  // PUT 수정
  http.put(`${DISTILLERY_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockDistilleryFormResponse,
        code: 'DISTILLERY_UPDATED',
        targetId: Number(params.id),
        message: `${body.korName} 증류소가 수정되었습니다.`,
      })
    );
  }),

  // DELETE 삭제
  http.delete(`${DISTILLERY_BASE}/:id`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockDistilleryDeleteResponse,
        targetId: Number(params.id),
      })
    );
  }),
];

export const handlers = [...tastingTagHandlers, ...bannerHandlers, ...alcoholHandlers, ...userHandlers, ...distilleryHandlers];
