import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { wrapApiResponse, wrapApiError } from '@/test/mocks/data';
import { bannerService } from '../banner.service';

const BASE = '/admin/api/v1/banners';

describe('bannerService', () => {
  // ==========================================
  // bulkReorder()
  // ==========================================
  describe('bulkReorder()', () => {
    it('PATCH /banners/bulk/reorder에 { ids } body를 전송하고 응답을 반환한다', async () => {
      let capturedUrl = '';
      let capturedBody: { ids: number[] } | null = null;

      server.use(
        http.patch(`${BASE}/bulk/reorder`, async ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          capturedBody = (await request.json()) as { ids: number[] };
          return HttpResponse.json(
            wrapApiResponse({
              code: 'BANNER_REORDERED',
              message: '배너 순서가 변경되었습니다.',
              targetId: capturedBody.ids[0] ?? 0,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await bannerService.bulkReorder([2, 1]);

      expect(capturedUrl).toBe('/admin/api/v1/banners/bulk/reorder');
      expect(capturedBody).toEqual({ ids: [2, 1] });
      expect(result.code).toBe('BANNER_REORDERED');
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

      await expect(bannerService.bulkReorder([999])).rejects.toThrow();
    });
  });
});
