import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockCurationListItems, wrapApiResponse, wrapApiError } from '@/test/mocks/data';
import { curationService } from '../curation.service';

const BASE = '/admin/api/v1/curations';

describe('curationService', () => {
  // ==========================================
  // search()
  // ==========================================
  describe('search()', () => {
    it('파라미터 없이 호출하면 전체 목록을 반환한다', async () => {
      const result = await curationService.search();
      expect(result.items).toHaveLength(mockCurationListItems.length);
      expect(result.items[0]!.name).toBe('신년 특집 큐레이션');
      expect(result.meta.totalElements).toBe(mockCurationListItems.length);
    });
  });

  // ==========================================
  // bulkReorder()
  // ==========================================
  describe('bulkReorder()', () => {
    it('PATCH /curations/bulk/reorder에 { ids } body를 전송하고 응답을 반환한다', async () => {
      let capturedUrl = '';
      let capturedBody: { ids: number[] } | null = null;

      server.use(
        http.patch(`${BASE}/bulk/reorder`, async ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          capturedBody = (await request.json()) as { ids: number[] };
          return HttpResponse.json(
            wrapApiResponse({
              code: 'CURATION_REORDERED',
              message: '큐레이션 순서가 변경되었습니다.',
              targetId: capturedBody.ids[0] ?? 0,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await curationService.bulkReorder([2, 1]);

      expect(capturedUrl).toBe('/admin/api/v1/curations/bulk/reorder');
      expect(capturedBody).toEqual({ ids: [2, 1] });
      expect(result.code).toBe('CURATION_REORDERED');
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

      await expect(curationService.bulkReorder([999])).rejects.toThrow();
    });
  });
});
