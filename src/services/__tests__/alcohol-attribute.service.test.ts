import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  mockAlcoholAttributeRows,
  mockAttributedAlcohols,
  wrapApiResponse,
} from '@/test/mocks/data';
import { alcoholAttributeService } from '../alcohol-attribute.service';

const BASE = '/admin/api/v1/alcohols/attributes';

describe('alcoholAttributeService', () => {
  it('list()는 alcoholIds를 쉼표로 이어 보내고 선택 위스키의 행만 받는다', async () => {
    let query: string | null = null;
    server.use(
      http.get(BASE, ({ request }) => {
        query = new URL(request.url).searchParams.get('alcoholIds');
        return HttpResponse.json(wrapApiResponse(mockAlcoholAttributeRows));
      })
    );

    const rows = await alcoholAttributeService.list([10, 20]);

    expect(query).toBe('10,20');
    expect(rows).toHaveLength(5);
    expect(rows[0]!.key).toBe('keyword');
  });

  it('summary()는 alcoholIds를 쉼표로 이어 보낸다', async () => {
    let query: string | null = null;
    server.use(
      http.get(`${BASE}/summary`, ({ request }) => {
        query = new URL(request.url).searchParams.get('alcoholIds');
        return HttpResponse.json(wrapApiResponse([]));
      })
    );

    await alcoholAttributeService.summary([20, 10]);

    expect(query).toBe('20,10');
  });

  it('attributedAlcohols()는 조건을 쿼리로 보내고 위스키 목록과 페이지 메타를 돌려준다', async () => {
    let query: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE}/alcohols`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(
          wrapApiResponse(mockAttributedAlcohols.slice(0, 1), {
            page: 1,
            size: 1,
            totalElements: 2,
            totalPages: 2,
            hasNext: false,
          })
        );
      })
    );

    const result = await alcoholAttributeService.attributedAlcohols({
      keyword: '글렌',
      type: 'PRICE',
      key: 'bottle_price_krw',
      missingKey: 'ops_note',
      page: 1,
      size: 1,
    });

    expect(query!.get('keyword')).toBe('글렌');
    expect(query!.get('type')).toBe('PRICE');
    expect(query!.get('key')).toBe('bottle_price_krw');
    expect(query!.get('missingKey')).toBe('ops_note');
    expect(query!.get('value')).toBeNull();
    expect(query!.get('page')).toBe('1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.korName).toBe('글렌피딕 12년');
    expect(result.items[0]!.attributes.map((row) => row.key)).toContain('bottle_price_krw');
    expect(result.meta).toMatchObject({ page: 1, totalElements: 2, totalPages: 2, hasNext: false });
  });
});
