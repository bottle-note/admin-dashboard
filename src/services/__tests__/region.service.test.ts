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
      expect(result.items[0]!.imageUrl).toBe('https://example.com/regions/scotland.webp');
      expect(result.items[2]!.imageUrl).toBeNull();
      expect(result.meta.totalElements).toBe(mockRegionListItems.length);
    });
  });

  // ==========================================
  // detail()/create()/update()
  // ==========================================
  describe('imageUrl 계약', () => {
    it('상세 응답의 imageUrl을 그대로 반환한다', async () => {
      const resultWithImage = await regionService.detail(1);
      const resultWithoutImage = await regionService.detail(3);

      expect(resultWithImage.imageUrl).toBe('https://example.com/regions/scotland.webp');
      expect(resultWithoutImage.imageUrl).toBeNull();
    });

    it('생성 요청에 nullable imageUrl을 그대로 전송한다', async () => {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(BASE, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'REGION_CREATED',
              message: '지역이 생성되었습니다.',
              targetId: 99,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      await regionService.create({
        korName: '일본',
        engName: 'Japan',
        imageUrl: null,
      });

      expect(capturedBody).toMatchObject({ imageUrl: null });
    });

    it('수정 요청에 imageUrl URL을 그대로 전송한다', async () => {
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.put(`${BASE}/1`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'REGION_UPDATED',
              message: '지역이 수정되었습니다.',
              targetId: 1,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      await regionService.update(1, {
        korName: '스코틀랜드',
        engName: 'Scotland',
        imageUrl: 'https://example.com/regions/scotland-updated.webp',
      });

      expect(capturedBody).toMatchObject({
        imageUrl: 'https://example.com/regions/scotland-updated.webp',
      });
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
