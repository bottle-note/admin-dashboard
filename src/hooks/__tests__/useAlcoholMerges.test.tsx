import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { ToastContext } from '@/hooks/useToast';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { adminAlcoholKeys } from '@/services/admin-alcohol.service';
import { adminAlcoholMergeKeys } from '@/services/admin-alcohol-merge.service';
import { useAlcoholMerge } from '../useAlcoholMerges';

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 2, retryDelay: 0 } } });
  const toast = { toasts: [], showToast: vi.fn(), dismissToast: vi.fn(), clearAllToasts: vi.fn() };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
    </QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useAlcoholMerge', () => {
  it('전역 재시도 설정이 있어도 응답을 잃은 병합 요청을 반복하지 않는다', async () => {
    let requests = 0;
    server.use(
      http.post('/admin/api/v1/alcohols/merges', () => {
        requests += 1;
        return HttpResponse.error();
      })
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAlcoholMerge(), { wrapper });

    act(() => result.current.mutate({ baseAlcoholId: 10, duplicateAlcoholIds: [20] }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requests).toBe(1);
  });

  it('성공하면 목록과 이력을 무효화하고 삭제된 위스키 상세 캐시를 제거한다', async () => {
    server.use(
      http.post('/admin/api/v1/alcohols/merges', () =>
        HttpResponse.json(
          wrapApiResponse({
            code: 'ALCOHOL_MERGED',
            message: '병합됨',
            targetId: 10,
            responseAt: '2026-11-11 12:00:00',
          })
        )
      )
    );
    const { client, wrapper } = createWrapper();
    const listKey = adminAlcoholKeys.list();
    const logsKey = adminAlcoholMergeKeys.list();
    client.setQueryData(listKey, { items: [10, 20] });
    client.setQueryData(logsKey, { items: [] });
    client.setQueryData(adminAlcoholKeys.detail(20), { alcoholId: 20 });
    const { result } = renderHook(() => useAlcoholMerge(), { wrapper });

    act(() => result.current.mutate({ baseAlcoholId: 10, duplicateAlcoholIds: [20] }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(logsKey)?.isInvalidated).toBe(true);
    expect(client.getQueryData(adminAlcoholKeys.detail(20))).toBeUndefined();
  });
});
