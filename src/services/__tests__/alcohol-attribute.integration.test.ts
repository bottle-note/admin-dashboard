import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { wrapApiError, wrapApiResponse } from '@/test/mocks/data';
import { alcoholAttributeService as service } from '../alcohol-attribute.service';
import type {
  AlcoholAttribute,
  AttributeCreateRequest,
  AttributeMapping,
  AttributedAlcohol,
  AttributeUpdateRequest,
} from '@/types/api/alcohol-attribute.api';

const base = '/admin/api/v1/alcohols/attributes';
const audit = {
  createAt: '2026-10-19T09:00:00',
  lastModifyAt: '2026-10-19T09:00:00',
  createPrincipal: null,
  lastModifyPrincipal: null,
};
const attribute = (id: number): AlcoholAttribute => ({
  ...audit,
  id,
  key: `attribute_${id}`,
  displayName: `속성 ${id}`,
  type: 'IDENTITY',
  datatype: 'INT',

  unit: null,
  description: null,
});
const mapping = (id: number): AttributeMapping => ({
  ...audit,
  id,
  alcoholId: id,
  attributeId: 1,
  value: '9007199254740993',
});
const alcohol = (id: number): AttributedAlcohol => ({
  alcoholId: id,
  korName: `위스키 ${id}`,
  engName: null,
  korCategory: null,
  imageUrl: null,
  attributes: [{ mappingId: 1, value: '9007199254740993', attribute: attribute(1) }],
});

// GlobalResponse.fromPage: data is the page content, pagination is in meta.
function pageResponse<T>(items: T[], page: number, size: number) {
  return wrapApiResponse(items.slice(page * size, (page + 1) * size), {
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    hasNext: (page + 1) * size < items.length,
  });
}

describe('alcoholAttributeService HTTP 계약', () => {
  it('복합 검색은 조건 배열과 AND/OR 및 페이지 메타데이터를 보존한다', async () => {
    const payload = {
      keyword: '글렌',
      match: 'AND' as const,
      page: 1,
      size: 20,
      conditions: [
        { key: 'price', operator: 'GTE' as const, value: '9007199254740993' },
        { key: 'price', operator: 'LTE' as const, value: '9007199254740999' },
        { key: 'recommended', operator: 'EXISTS' as const },
      ],
    };
    let body: unknown;
    const response = pageResponse([alcohol(1)], 0, 20);
    server.use(
      http.post(`${base}/alcohols/search`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(response);
      })
    );
    const result = await service.searchAlcohols(payload);
    expect(body).toEqual(payload);
    expect(result).toEqual({ items: response.data, meta: response.meta });
  });

  it.each([
    ['list', base, attribute(101)],
    ['alcohols', `${base}/alcohols`, alcohol(101)],
  ] as const)('%s는 두 번째 페이지와 서버 메타데이터를 보존한다', async (method, path, item) => {
    let query: URLSearchParams | undefined;
    const response = wrapApiResponse([item], {
      page: 1,
      size: 100,
      totalElements: 101,
      totalPages: 2,
      hasNext: false,
    });
    server.use(
      http.get(path, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(response);
      })
    );
    const result = await service[method]({ page: 1, size: 100 });
    expect(query?.get('page')).toBe('1');
    expect(query?.get('size')).toBe('100');
    expect(result).toEqual({ items: [item], meta: response.meta });
  });

  it('속성 검색의 alcoholIds를 반복 쿼리로 보내고 검색 조건을 보존한다', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(base, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(pageResponse([], 2, 20));
      })
    );
    await service.list({
      alcoholIds: [12, 34],
      keyword: '숙성 연수',
      type: 'IDENTITY',
      page: 2,
      size: 20,
    });
    expect(query?.getAll('alcoholIds')).toEqual(['12', '34']);
    expect(query?.has('alcoholIds[]')).toBe(false);
    expect(query?.get('keyword')).toBe('숙성 연수');
    expect(query?.get('type')).toBe('IDENTITY');
  });

  it('summary는 반복 alcoholIds와 서버의 연결 ID 및 집계를 보존한다', async () => {
    let query: URLSearchParams | undefined;
    const summary = [
      {
        attribute: attribute(1),
        alcoholIds: [12],
        mappingIds: [8],
        registeredCount: 1,
        selectedCount: 2,
      },
    ];
    server.use(
      http.get(`${base}/summary`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(wrapApiResponse(summary));
      })
    );
    expect(await service.summary([12, 34])).toEqual(summary);
    expect(query?.getAll('alcoholIds')).toEqual(['12', '34']);
    expect(query?.has('alcoholIds[]')).toBe(false);
  });

  it('생성은 값 없이 정의를 보내고 생성된 속성을 반환한다', async () => {
    const created = attribute(9);
    const payload: AttributeCreateRequest = {
      key: created.key,
      displayName: created.displayName,
      type: created.type,
      datatype: created.datatype,

      unit: null,
      description: null,
    };
    let body: unknown;
    server.use(
      http.post(base, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(wrapApiResponse(created));
      })
    );
    expect(await service.create(payload)).toEqual(created);
    expect(body).toEqual(payload);
  });

  it('수정은 key와 값 없이 정의와 명시적인 null을 보낸다', async () => {
    const payload: AttributeUpdateRequest = {
      displayName: '정밀 값',
      type: 'IDENTITY',
      datatype: 'DOUBLE',

      unit: null,
      description: null,
    };
    const result = {
      code: 'ALCOHOL_ATTRIBUTE_UPDATED',
      message: '수정했습니다.',
      targetId: 9,
      responseAt: audit.lastModifyAt,
    };
    let body: unknown;
    server.use(
      http.put(`${base}/9`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(wrapApiResponse(result));
      })
    );
    expect(await service.update(9, payload)).toEqual(result);
    expect(body).toEqual(payload);
    expect(body).not.toHaveProperty('key');
  });

  it('매핑 값 수정은 문자열 정밀도를 보존하고 매핑 ID로 요청한다', async () => {
    server.use(
      http.put(`${base}/mappings/8`, async ({ request }) => {
        expect(await request.json()).toEqual({ value: '-123456789012345.123456' });
        return HttpResponse.json(
          wrapApiResponse({ ...mapping(8), value: '-123456789012345.123456' })
        );
      })
    );
    expect(await service.updateMapping(8, '-123456789012345.123456')).toEqual({
      ...mapping(8),
      value: '-123456789012345.123456',
    });
  });

  it('500건 연결 요청의 쌍과 서버의 중복 제외 결과를 보존한다', async () => {
    const items = Array.from({ length: 500 }, (_, index) => ({
      alcoholId: index + 1,
      attributeId: 9,
      value: '9007199254740993',
    }));
    const result = { added: 1, skipped: 499, createdIds: [800] };
    let body: unknown;
    server.use(
      http.post(`${base}/mappings/batch`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(wrapApiResponse(result));
      })
    );
    expect(await service.link(items)).toEqual(result);
    expect(body).toEqual({ items });
  });

  it('일괄 삭제는 ids를 보내고 실제로 삭제된 속성 배열을 반환한다', async () => {
    let body: unknown;
    const deleted = [attribute(9)];
    server.use(
      http.post(`${base}/batch/delete`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(wrapApiResponse(deleted));
      })
    );
    expect(await service.deleteBatch([9, 99])).toEqual(deleted);
    expect(body).toEqual({ ids: [9, 99] });
  });

  it('연결 해제는 mapping ID를 경로에 사용한다', async () => {
    const result = {
      code: 'ALCOHOL_ATTRIBUTE_MAPPING_DELETED',
      message: '해제했습니다.',
      targetId: 800,
      responseAt: audit.lastModifyAt,
    };
    server.use(
      http.delete(`${base}/mappings/800`, () => HttpResponse.json(wrapApiResponse(result)))
    );
    expect(await service.unlink(800)).toEqual(result);
  });

  it.each([400, 409])(
    'HTTP %i 저장 실패의 오류 코드와 메시지를 호출자에게 전달한다',
    async (status) => {
      server.use(
        http.post(base, () =>
          HttpResponse.json(
            wrapApiError(status, 'ALCOHOL_ATTRIBUTE_DUPLICATE', '이미 사용 중인 표시명입니다.'),
            { status }
          )
        )
      );
      await expect(
        service.create({
          key: 'duplicate',
          displayName: '중복',
          type: 'FLAG',
          datatype: 'BOOLEAN',
        })
      ).rejects.toMatchObject({
        name: 'ApiError',
        code: status,
        primaryCode: 'ALCOHOL_ATTRIBUTE_DUPLICATE',
        message: '이미 사용 중인 표시명입니다.',
      });
    }
  );

  it('HTTP 200이어도 success=false이면 연결 성공으로 반환하지 않는다', async () => {
    server.use(
      http.post(`${base}/mappings/batch`, () =>
        HttpResponse.json(
          wrapApiError(400, 'ALCOHOL_ATTRIBUTE_BATCH_SIZE_INVALID', '최대 500건입니다.')
        )
      )
    );
    await expect(
      service.link([{ alcoholId: 12, attributeId: 9, value: '9007199254740993' }])
    ).rejects.toMatchObject({
      name: 'ApiError',
      primaryCode: 'ALCOHOL_ATTRIBUTE_BATCH_SIZE_INVALID',
      message: '최대 500건입니다.',
    });
  });
});

describe('페이지 조회 범위', () => {
  it('hasNext가 있어도 요청한 페이지 한 번만 조회하고 다음 페이지는 호출자가 선택한다', async () => {
    const reads: number[] = [];
    server.use(
      http.get(`${base}/alcohols`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = Number(params.get('page'));
        reads.push(page);
        expect(params.get('size')).toBe('100');
        return HttpResponse.json(
          pageResponse(
            Array.from({ length: 3000 }, (_, i) => alcohol(i + 1)),
            page,
            100
          )
        );
      })
    );
    const first = await service.alcohols({ page: 0, size: 100 });
    expect(first.items).toHaveLength(100);
    expect(first.meta.hasNext).toBe(true);
    expect(reads).toEqual([0]);
    const second = await service.alcohols({ page: 1, size: 100 });
    expect(second.items[0]?.alcoholId).toBe(101);
    expect(reads).toEqual([0, 1]);
  });
});
