import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { ToastContext, useToastState } from '@/hooks/useToast';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/mocks/server';
import {
  useAlcoholAttributes,
  useAlcoholAttributeUpdate,
  useAttributeMappings,
  useAttributeLink,
  useAttributeUnlink,
} from '../useAlcoholAttributes';

const base = '/admin/api/v1/alcohols/attributes';
const envelope = (data: unknown) => ({
  success: true,
  data,
  meta: { page: 1, size: 10, totalElements: 11, totalPages: 2, hasNext: false },
});
const wrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    const toast = useToastState();
    return (
      <QueryClientProvider client={client}>
        <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
      </QueryClientProvider>
    );
  };
};

describe('속성 API 데이터 흐름', () => {
  it('검색과 페이지 조건을 보내고 서버 페이지 정보를 보존한다', async () => {
    server.use(
      http.get(base, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get('keyword')).toBe('숙성');
        expect(params.get('page')).toBe('1');
        expect(params.getAll('alcoholIds')).toEqual(['12', '34']);
        return HttpResponse.json(envelope([]));
      })
    );
    const { result } = renderHook(
      () => useAlcoholAttributes({ keyword: '숙성', page: 1, size: 10, alcoholIds: [12, 34] }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta.totalElements).toBe(11);
    expect(result.current.data?.items).toEqual([]);
  });

  it('수정 payload에서 key를 제외하고 성공 후 목록을 재조회한다', async () => {
    let name = '수정 전';
    server.use(
      http.get(base, () => HttpResponse.json(envelope([{ id: 1, displayName: name }]))),
      http.put(`${base}/1`, async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({
          displayName: '수정 후',
          type: 'IDENTITY',
          datatype: 'INT',

          unit: null,
          description: null,
        });
        name = '수정 후';
        return HttpResponse.json(envelope({ targetId: 1 }));
      })
    );
    const { result } = renderHook(
      () => ({ list: useAlcoholAttributes({}), update: useAlcoholAttributeUpdate() }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(async () => {
      await result.current.update.mutateAsync({
        id: 1,
        data: {
          displayName: '수정 후',
          type: 'IDENTITY',
          datatype: 'INT',

          unit: null,
          description: null,
        },
      });
    });
    await waitFor(() => expect(result.current.list.data?.items[0]?.displayName).toBe('수정 후'));
  });

  it('저장 완료를 반환하기 전에 활성 목록 갱신을 한 번 기다린다', async () => {
    let reads = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(base, async () => {
        reads++;
        if (reads > 1) await gate;
        return HttpResponse.json(envelope([]));
      }),
      http.put(`${base}/1`, () => HttpResponse.json(envelope({ targetId: 1 })))
    );
    const { result } = renderHook(
      () => ({ list: useAlcoholAttributes({}), update: useAlcoholAttributeUpdate() }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    let completed = false;
    let save!: Promise<unknown>;
    act(() => {
      save = result.current.update
        .mutateAsync({ id: 1, data: { displayName: '수정', type: 'FLAG', datatype: 'BOOLEAN' } })
        .then(() => {
          completed = true;
        });
    });
    await waitFor(() => expect(reads).toBe(2));
    const finishedBeforeRefresh = completed;
    await act(async () => {
      release!();
      await save;
    });
    expect(finishedBeforeRefresh).toBe(false);
    expect(reads).toBe(2);
  });

  it('중복 연결 결과를 보존하고 해제 후 매핑을 재조회한다', async () => {
    let mappings = [{ id: 8, alcoholId: 12, attributeId: 1, value: '9007199254740993' }];
    server.use(
      http.get(`${base}/mappings`, () => HttpResponse.json(envelope(mappings))),
      http.post(`${base}/mappings/batch`, async ({ request }) => {
        expect(await request.json()).toEqual({
          items: [{ alcoholId: 12, attributeId: 1, value: '9007199254740993' }],
        });
        return HttpResponse.json(envelope({ added: 0, skipped: 1, createdIds: [] }));
      }),
      http.delete(`${base}/mappings/8`, () => {
        mappings = [];
        return HttpResponse.json(envelope({ targetId: 8 }));
      })
    );
    const { result } = renderHook(
      () => ({
        list: useAttributeMappings({ alcoholId: 12 }),
        link: useAttributeLink(),
        unlink: useAttributeUnlink(),
      }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(async () => {
      expect(
        await result.current.link.mutateAsync([
          { alcoholId: 12, attributeId: 1, value: '9007199254740993' },
        ])
      ).toEqual({
        added: 0,
        skipped: 1,
        createdIds: [],
      });
      await result.current.unlink.mutateAsync(8);
    });
    await waitFor(() => expect(result.current.list.data?.items).toEqual([]));
  });

  it('저장 실패를 호출자에게 전달하고 기존 조회 값을 유지한다', async () => {
    server.use(
      http.get(base, () => HttpResponse.json(envelope([{ id: 1, displayName: '기존 값' }]))),
      http.put(`${base}/1`, () =>
        HttpResponse.json(
          {
            success: false,
            code: 409,
            errors: [{ code: 'DUPLICATE', message: '이미 사용 중인 이름입니다.' }],
          },
          { status: 409 }
        )
      )
    );
    const { result } = renderHook(
      () => ({ list: useAlcoholAttributes({}), update: useAlcoholAttributeUpdate() }),
      { wrapper: wrapper() }
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(async () => {
      await expect(
        result.current.update.mutateAsync({
          id: 1,
          data: {
            displayName: '중복',
            type: 'FLAG',
            datatype: 'BOOLEAN',
          },
        })
      ).rejects.toThrow('이미 사용 중인 이름입니다.');
    });
    expect(result.current.list.data?.items[0]?.displayName).toBe('기존 값');
  });
});
