import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError } from '@/test/mocks/data';
import { useCurationList, useCurationBulkReorder } from '../useCurationOld';

const BASE = '/admin/api/v1/curations';

describe('useCurationOld hooks', () => {
  describe('useCurationList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useCurationList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });
  });

  describe('useCurationBulkReorder', () => {
    it('일괄 노출순서 변경 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useCurationBulkReorder({ onSuccess }));

      result.current.mutate({ ids: [2, 1] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.patch(`${BASE}/bulk/reorder`, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useCurationBulkReorder());

      result.current.mutate({ ids: [2, 1] });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
