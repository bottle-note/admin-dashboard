import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError } from '@/test/mocks/data';
import { useUserList } from '../useUsers';

const BASE = '/admin/api/v1/users';

describe('useUsers hooks', () => {
  describe('useUserList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useUserList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() => useUserList({ keyword: '위스키러버' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.nickName).toBe('위스키러버');
    });

    it('status로 필터링한다', async () => {
      const { result } = renderHook(() => useUserList({ status: 'DELETED' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.status).toBe('DELETED');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useUserList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
