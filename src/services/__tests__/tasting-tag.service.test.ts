import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  mockTastingTagListItems,
  wrapApiResponse,
  wrapApiError,
} from '@/test/mocks/data';
import { tastingTagService } from '../tasting-tag.service';

const BASE = '/admin/api/v1/tasting-tags';

describe('tastingTagService', () => {
  // ==========================================
  // list()
  // ==========================================
  describe('list()', () => {
    it('파라미터 없이 호출하면 전체 목록을 반환한다', async () => {
      const result = await tastingTagService.list();
      expect(result.items).toHaveLength(mockTastingTagListItems.length);
      expect(result.items[0]!.korName).toBe('바닐라');
      expect(result.meta.totalElements).toBe(mockTastingTagListItems.length);
    });

    it('keyword 파라미터로 필터링된 결과를 반환한다', async () => {
      const result = await tastingTagService.list({ keyword: '바닐라' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.korName).toBe('바닐라');
    });

    it('빈 결과를 정상 처리한다', async () => {
      const result = await tastingTagService.list({ keyword: '존재하지않는태그' });
      expect(result.items).toHaveLength(0);
      expect(result.meta.totalElements).toBe(0);
    });
  });

  // ==========================================
  // detail()
  // ==========================================
  describe('detail()', () => {
    it('태그 ID로 상세 정보를 반환한다', async () => {
      const result = await tastingTagService.detail(1);
      expect(result.tag.id).toBe(1);
      expect(result.tag.korName).toBe('바닐라');
      expect(result.tag.icon).toBeTruthy();
      expect(result.tag.children).toHaveLength(1);
      expect(result.alcohols).toHaveLength(2);
    });

    it('존재하지 않는 ID는 에러를 throw한다', async () => {
      await expect(tastingTagService.detail(9999)).rejects.toThrow();
    });
  });

  // ==========================================
  // create()
  // ==========================================
  describe('create()', () => {
    it('아이콘 포함 태그를 생성한다', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(BASE, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_CREATED',
              message: '생성됨',
              targetId: 99,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await tastingTagService.create({
        korName: '스모키',
        engName: 'Smoky',
        icon: 'data:image/png;base64,abc123',
        description: '스모키한 향',
      });

      expect(result.targetId).toBe(99);
      expect(capturedBody).toMatchObject({
        korName: '스모키',
        engName: 'Smoky',
        icon: 'data:image/png;base64,abc123',
      });
    });

    it('아이콘 없이 태그를 생성한다', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(BASE, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_CREATED',
              message: '생성됨',
              targetId: 100,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      await tastingTagService.create({
        korName: '허브',
        engName: 'Herbal',
        icon: null,
      });

      expect(capturedBody).toMatchObject({
        korName: '허브',
        icon: null,
      });
    });
  });

  // ==========================================
  // update()
  // ==========================================
  describe('update()', () => {
    it('엔드포인트에 ID가 치환되어 PUT 요청을 보낸다', async () => {
      let capturedUrl = '';
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.put(`${BASE}/:id`, async ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_UPDATED',
              message: '수정됨',
              targetId: 1,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await tastingTagService.update(1, {
        korName: '바닐라 수정',
        engName: 'Vanilla Updated',
      });

      expect(capturedUrl).toBe('/admin/api/v1/tasting-tags/1');
      expect(capturedBody).toMatchObject({ korName: '바닐라 수정' });
      expect(result.targetId).toBe(1);
    });
  });

  // ==========================================
  // delete()
  // ==========================================
  describe('delete()', () => {
    it('태그를 삭제한다', async () => {
      let capturedUrl = '';

      server.use(
        http.delete(`${BASE}/:id`, ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_DELETED',
              message: '삭제됨',
              targetId: 1,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await tastingTagService.delete(1);
      expect(capturedUrl).toBe('/admin/api/v1/tasting-tags/1');
      expect(result.targetId).toBe(1);
    });

    it('자식 태그가 있으면 에러를 반환한다', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'HAS_CHILDREN', '자식 태그가 존재하여 삭제할 수 없습니다.'),
            { status: 400 }
          );
        })
      );

      await expect(tastingTagService.delete(1)).rejects.toThrow();
    });
  });

  // ==========================================
  // connectAlcohols()
  // ==========================================
  describe('connectAlcohols()', () => {
    it('위스키 ID 배열을 POST body로 전송한다', async () => {
      let capturedUrl = '';
      let capturedBody: { alcoholIds: number[] } | null = null;

      server.use(
        http.post(`${BASE}/:id/alcohols`, async ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          capturedBody = (await request.json()) as { alcoholIds: number[] };
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_ALCOHOL_ADDED',
              message: '연결됨',
              targetId: 1,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await tastingTagService.connectAlcohols(1, [10, 20]);
      expect(capturedUrl).toBe('/admin/api/v1/tasting-tags/1/alcohols');
      expect(capturedBody).toEqual({ alcoholIds: [10, 20] });
      expect(result.code).toBe('TASTING_TAG_ALCOHOL_ADDED');
    });

    it('API 에러 시 throw한다', async () => {
      server.use(
        http.post(`${BASE}/:id/alcohols`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'ALREADY_CONNECTED', '이미 연결된 위스키입니다.'),
            { status: 400 }
          );
        })
      );

      await expect(tastingTagService.connectAlcohols(1, [10])).rejects.toThrow();
    });
  });

  // ==========================================
  // disconnectAlcohols()
  // ==========================================
  describe('disconnectAlcohols()', () => {
    it('DELETE with body로 위스키 연결을 해제한다', async () => {
      let capturedBody: { alcoholIds: number[] } | null = null;

      server.use(
        http.delete(`${BASE}/:id/alcohols`, async ({ request }) => {
          capturedBody = (await request.json()) as { alcoholIds: number[] };
          return HttpResponse.json(
            wrapApiResponse({
              code: 'TASTING_TAG_ALCOHOL_REMOVED',
              message: '해제됨',
              targetId: 1,
              responseAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const result = await tastingTagService.disconnectAlcohols(1, [10]);
      expect(capturedBody).toEqual({ alcoholIds: [10] });
      expect(result.code).toBe('TASTING_TAG_ALCOHOL_REMOVED');
    });

    it('API 에러 시 throw한다', async () => {
      server.use(
        http.delete(`${BASE}/:id/alcohols`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'NOT_CONNECTED', '연결되지 않은 위스키입니다.'),
            { status: 400 }
          );
        })
      );

      await expect(tastingTagService.disconnectAlcohols(1, [999])).rejects.toThrow();
    });
  });
});
