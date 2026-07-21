import { http, HttpResponse } from 'msw';
import {
  mockTastingTagListItems,
  mockTastingTagDetail,
  mockFormResponse,
  mockDeleteResponse,
  mockAlcoholConnectionResponse,
  mockAlcoholDisconnectionResponse,
  mockAlcoholListItems,
  mockAlcoholLookupItems,
  mockAlcoholDetails,
  mockAlcoholDeleteResponse,
  mockCategoryReferences,
  mockBannerListItems,
  mockBannerDetail,
  mockBannerCreateResponse,
  mockBannerUpdateResponse,
  mockBannerDeleteResponse,
  mockBannerUpdateStatusResponse,
  mockBannerBulkReorderResponse,
  mockUserListItems,
  mockReviewListItems,
  mockDistilleryListItems,
  mockDistilleryDetail,
  mockDistilleryFormResponse,
  mockDistilleryDeleteResponse,
  mockRegionListItems,
  mockRegionDetail,
  mockRegionFormResponse,
  mockRegionDeleteResponse,
  mockRegionBulkReorderResponse,
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
        (t) =>
          t.korName.includes(keyword) || t.engName.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const sliced = items.slice(start, start + size);

    return HttpResponse.json(
      wrapApiResponse(sliced, {
        page,
        size,
        totalElements,
        totalPages,
        hasNext: start + size < totalElements,
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

  // PATCH 정렬순서 일괄 변경
  http.patch(`${BANNER_BASE}/bulk/reorder`, async ({ request }) => {
    const body = (await request.json()) as { ids: number[] };
    return HttpResponse.json(
      wrapApiResponse({
        ...mockBannerBulkReorderResponse,
        targetId: body.ids[0] ?? 0,
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
    return HttpResponse.json(wrapApiResponse(mockBannerCreateResponse));
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

  // GET lookup (상세보다 먼저 매칭되도록)
  http.get(`${ALCOHOL_BASE}/lookup`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const category = url.searchParams.get('category');
    const regionId = url.searchParams.get('regionId');
    const distilleryId = url.searchParams.get('distilleryId');
    const cursor = Number(url.searchParams.get('cursor') ?? 0);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

    let items = mockAlcoholLookupItems;

    if (keyword) {
      items = items.filter(
        (item) =>
          item.korName.includes(keyword) ||
          item.engName.toLowerCase().includes(keyword.toLowerCase()) ||
          item.korCategoryName.includes(keyword) ||
          item.engCategoryName.toLowerCase().includes(keyword.toLowerCase()) ||
          item.korRegion?.includes(keyword) ||
          item.engRegion?.toLowerCase().includes(keyword.toLowerCase()) ||
          item.korDistillery?.includes(keyword) ||
          item.engDistillery?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (category && category !== 'ALL') {
      items = items.filter((item) => item.categoryGroup === category);
    }
    if (regionId) {
      items = items.filter((item) => item.regionId === Number(regionId));
    }
    if (distilleryId) {
      items = items.filter((item) => item.distilleryId === Number(distilleryId));
    }

    const sliced = items.slice(cursor, cursor + pageSize);
    const nextCursor = cursor + sliced.length;

    return HttpResponse.json(
      wrapApiResponse(sliced, {
        pageable: {
          currentCursor: cursor,
          cursor: nextCursor,
          pageSize,
          hasNext: nextCursor < items.length,
        },
      })
    );
  }),

  // GET 상세
  http.get(`${ALCOHOL_BASE}/:alcoholId`, ({ params }) => {
    const alcoholId = Number(params.alcoholId);
    const detail = mockAlcoholDetails.find((item) => item.alcoholId === alcoholId);

    if (detail) {
      return HttpResponse.json(wrapApiResponse(detail));
    }

    return HttpResponse.json(
      {
        success: false,
        code: 404,
        data: null,
        errors: [{ code: 'ALCOHOL_NOT_FOUND', message: '위스키를 찾을 수 없습니다.' }],
        meta: {},
      },
      { status: 404 }
    );
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
      items = items.filter(
        (item) => item.engCategoryName.toUpperCase().replace(' ', '_') === category
      );
    }

    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const sliced = items.slice(start, start + size);

    return HttpResponse.json(
      wrapApiResponse(sliced, {
        page,
        size,
        totalElements,
        totalPages,
        hasNext: start + size < totalElements,
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
// Review Handlers
// ============================================

const REVIEW_BASE = '/admin/api/v1/reviews';

export const reviewHandlers = [
  // GET 목록
  http.get(REVIEW_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const activeStatus = url.searchParams.get('activeStatus');
    const displayStatus = url.searchParams.get('displayStatus');
    const alcoholId = url.searchParams.get('alcoholId');
    const userId = url.searchParams.get('userId');
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockReviewListItems;
    if (keyword) {
      items = items.filter(
        (r) =>
          r.content.includes(keyword) ||
          r.userNickname.includes(keyword) ||
          r.alcoholName.includes(keyword)
      );
    }
    if (activeStatus) {
      items = items.filter((r) => r.activeStatus === activeStatus);
    }
    if (displayStatus) {
      items = items.filter((r) => r.displayStatus === displayStatus);
    }
    if (alcoholId) {
      items = items.filter((r) => r.alcoholId === Number(alcoholId));
    }
    if (userId) {
      items = items.filter((r) => r.userId === Number(userId));
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
        (d) =>
          d.korName.includes(keyword) || d.engName.toLowerCase().includes(keyword.toLowerCase())
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

  // PATCH 정렬 순서 변경
  http.patch(`${DISTILLERY_BASE}/:id/sort-order`, async ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        code: 'DISTILLERY_SORT_ORDER_UPDATED',
        message: '증류소 정렬 순서가 변경되었습니다.',
        targetId: Number(params.id),
        responseAt: '2024-06-01T00:00:00',
      })
    );
  }),
];

// ============================================
// Region Handlers
// ============================================

const REGION_BASE = '/admin/api/v1/regions';

export const regionHandlers = [
  // GET 목록
  http.get(REGION_BASE, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const sortOrder = url.searchParams.get('sortOrder') ?? 'ASC';
    const size = Number(url.searchParams.get('size') ?? 20);
    const page = Number(url.searchParams.get('page') ?? 0);

    let items = mockRegionListItems;
    if (keyword) {
      items = items.filter(
        (region) =>
          region.korName.includes(keyword) ||
          region.engName.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    items = [...items].sort((a, b) =>
      sortOrder === 'DESC' ? b.sortOrder - a.sortOrder : a.sortOrder - b.sortOrder
    );

    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const sliced = items.slice(start, start + size);

    return HttpResponse.json(
      wrapApiResponse(sliced, {
        page,
        size,
        totalElements,
        totalPages,
        hasNext: start + size < totalElements,
      })
    );
  }),

  // PATCH 정렬순서 일괄 변경
  http.patch(`${REGION_BASE}/bulk/reorder`, async ({ request }) => {
    const body = (await request.json()) as { ids: number[] };
    return HttpResponse.json(
      wrapApiResponse({
        ...mockRegionBulkReorderResponse,
        targetId: body.ids[0] ?? 0,
      })
    );
  }),

  // GET 상세
  http.get(`${REGION_BASE}/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === mockRegionDetail.id) {
      return HttpResponse.json(wrapApiResponse(mockRegionDetail));
    }
    return HttpResponse.json(
      {
        success: false,
        code: 404,
        data: null,
        errors: [{ code: 'REGION_NOT_FOUND', message: '지역을 찾을 수 없습니다.' }],
        meta: {},
      },
      { status: 404 }
    );
  }),

  // POST 생성
  http.post(REGION_BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockRegionFormResponse,
        code: 'REGION_CREATED',
        targetId: 99,
        message: `${body.korName} 지역이 생성되었습니다.`,
      })
    );
  }),

  // PUT 수정
  http.put(`${REGION_BASE}/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      wrapApiResponse({
        ...mockRegionFormResponse,
        code: 'REGION_UPDATED',
        targetId: Number(params.id),
        message: `${body.korName} 지역이 수정되었습니다.`,
      })
    );
  }),

  // DELETE 삭제
  http.delete(`${REGION_BASE}/:id`, ({ params }) => {
    return HttpResponse.json(
      wrapApiResponse({
        ...mockRegionDeleteResponse,
        targetId: Number(params.id),
      })
    );
  }),
];

export const handlers = [
  ...tastingTagHandlers,
  ...bannerHandlers,
  ...alcoholHandlers,
  ...userHandlers,
  ...reviewHandlers,
  ...distilleryHandlers,
  ...regionHandlers,
];
