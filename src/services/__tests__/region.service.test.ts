import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockRegionListItems, wrapApiResponse, wrapApiError } from '@/test/mocks/data';
import { regionService } from '../region.service';

const BASE = '/admin/api/v1/regions';

describe('regionService', () => {
  // ==========================================
  // list()
  // ==========================================
  describe('list()', () => {
    it('파라미터 없이 호출하면 전체 목록을 반환한다', async () => {
      const result = await regionService.list();
      expect(result.items).toHaveLength(mockRegionListItems.length);
      expect(result.items[0]!.korName).toBe('스코틀랜드');
      expect(result.meta.totalElements).toBe(mockRegionListItems.length);
    });
  });

  // ==========================================
  // bulkReorder()
  // ==========================================
  describe('bulkReorder()', () => {
    it('PATCH /regions/bulk/reorder에 { ids } body를 전송하고 응답을 반환한다', async () => {
      let capturedUrl = '';
      let capturedBody: { ids: number[] } | null = null;

      server.use(
        http.patch(`${BASE}/bulk/reorder`, async ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          capturedBody = (await request.json()) as { ids: number[] };
          return HttpResponse.json(
            wrapApiResponse({
              code: 'REGION_REORDERED',
              message: '지역 순서가 변경되었습니다.',
              targetId: capturedBody.ids[0] ?? 0,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await regionService.bulkReorder([2, 1]);

      expect(capturedUrl).toBe('/admin/api/v1/regions/bulk/reorder');
      expect(capturedBody).toEqual({ ids: [2, 1] });
      expect(result.code).toBe('REGION_REORDERED');
      expect(result.targetId).toBe(2);
    });

    it('에러 응답 시 throw한다', async () => {
      server.use(
        http.patch(`${BASE}/bulk/reorder`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'INVALID_IDS', '유효하지 않은 ID가 포함되어 있습니다.'),
            { status: 400 }
          );
        })
      );

      await expect(regionService.bulkReorder([999])).rejects.toThrow();
    });
  });
});
