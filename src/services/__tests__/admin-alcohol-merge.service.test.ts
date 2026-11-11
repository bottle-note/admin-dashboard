import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { adminAlcoholMergeService } from '../admin-alcohol-merge.service';

const BASE = '/admin/api/v1/alcohols/merges';

describe('adminAlcoholMergeService', () => {
  it('미리보기 요청에 기준 ID와 중복 ID 순서를 보존하고 중복별 건수를 반환한다', async () => {
    let payload: unknown;
    const preview = {
      base: { alcoholId: 10, korName: '기준', engName: 'Base', imageUrl: null },
      duplicates: [
        {
          alcohol: { alcoholId: 20, korName: '중복', engName: 'Duplicate', imageUrl: null },
          counts: [{ name: 'ratings', moved: 2, deleted: 1 }],
        },
        {
          alcohol: { alcoholId: 30, korName: '중복 2', engName: 'Duplicate 2', imageUrl: null },
          counts: [{ name: 'ratings', moved: 0, deleted: 1 }],
        },
      ],
    };
    server.use(
      http.post(`${BASE}/preview`, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json(wrapApiResponse(preview));
      })
    );

    const result = await adminAlcoholMergeService.preview({
      baseAlcoholId: 10,
      duplicateAlcoholIds: [20, 30],
    });

    expect(payload).toEqual({ baseAlcoholId: 10, duplicateAlcoholIds: [20, 30] });
    expect(result).toEqual(preview);
  });

  it('이력 필터를 개별 쿼리로 보내고 페이지 정보와 nullable 처리자를 보존한다', async () => {
    let query: Record<string, string> = {};
    server.use(
      http.get(BASE, ({ request }) => {
        query = Object.fromEntries(new URL(request.url).searchParams);
        return HttpResponse.json(
          wrapApiResponse(
            [
              {
                mergeId: 1,
                mergeGroupId: 'merge-group',
                baseAlcoholId: 10,
                baseKorName: '기준',
                duplicateAlcoholId: 20,
                duplicateKorName: '중복',
                duplicateEngName: 'Duplicate',
                counts: [{ name: 'reviews', moved: 2, deleted: 0 }],
                mergedByAdminId: null,
                mergedByEmail: null,
                mergedAt: '2026-11-11T12:00:00',
              },
            ],
            { page: 2, size: 20, totalElements: 41, totalPages: 3, hasNext: false }
          )
        );
      })
    );

    const result = await adminAlcoholMergeService.list({
      baseAlcoholId: 10,
      duplicateAlcoholId: 20,
      page: 2,
      size: 20,
    });

    expect(query).toEqual({ baseAlcoholId: '10', duplicateAlcoholId: '20', page: '2', size: '20' });
    expect(result.meta).toMatchObject({ page: 2, totalElements: 41, hasNext: false });
    expect(result.items[0]).toMatchObject({ mergedByAdminId: null, mergedByEmail: null });
  });

  it('미리보기와 별개의 실행 경로에 같은 payload를 보내고 기준 ID를 반환한다', async () => {
    let payload: unknown;
    server.use(
      http.post(BASE, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json(
          wrapApiResponse({
            code: 'ALCOHOL_MERGED',
            message: '위스키가 병합되었습니다.',
            targetId: 10,
            responseAt: '2026-11-11 12:00:00',
          })
        );
      })
    );

    const result = await adminAlcoholMergeService.merge({
      baseAlcoholId: 10,
      duplicateAlcoholIds: [20],
    });

    expect(payload).toEqual({ baseAlcoholId: 10, duplicateAlcoholIds: [20] });
    expect(result).toMatchObject({ code: 'ALCOHOL_MERGED', targetId: 10 });
  });
});
