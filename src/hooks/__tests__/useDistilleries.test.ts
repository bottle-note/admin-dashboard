import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError } from '@/test/mocks/data';
import {
  useDistilleryList,
  useDistilleryDetail,
  useDistilleryCreate,
  useDistilleryUpdate,
  useDistilleryDelete,
} from '../useDistilleries';

const BASE = '/admin/api/v1/distilleries';

describe('useDistilleries hooks', () => {
  // ==========================================
  // useDistilleryList
  // ==========================================
  describe('useDistilleryList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useDistilleryList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() => useDistilleryList({ keyword: '맥캘란' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.korName).toBe('맥캘란');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useDistilleryList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useDistilleryDetail
  // ==========================================
  describe('useDistilleryDetail', () => {
    it('id가 undefined이면 쿼리가 비활성화된다', () => {
      const { result } = renderHook(() => useDistilleryDetail(undefined));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('상세 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useDistilleryDetail(1));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.id).toBe(1);
      expect(result.current.data!.korName).toBe('맥캘란');
      expect(result.current.data!.regionId).toBe(1);
      expect(result.current.data!.korRegion).toBe('스페이사이드');
    });

    it('존재하지 않는 ID는 에러 상태가 된다', async () => {
      const { result } = renderHook(() => useDistilleryDetail(9999));

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useDistilleryCreate
  // ==========================================
  describe('useDistilleryCreate', () => {
    it('생성 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useDistilleryCreate({ onSuccess }));

      result.current.mutate({
        korName: '새 증류소',
        engName: 'New Distillery',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.post(BASE, () => {
          return HttpResponse.json(
            wrapApiError(400, 'DUPLICATE_NAME', '이미 존재하는 증류소명입니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useDistilleryCreate());

      result.current.mutate({
        korName: '맥캘란',
        engName: 'Macallan',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useDistilleryUpdate
  // ==========================================
  describe('useDistilleryUpdate', () => {
    it('수정 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useDistilleryUpdate({ onSuccess }));

      result.current.mutate({
        id: 1,
        data: { korName: '수정됨', engName: 'Updated' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ==========================================
  // useDistilleryDelete
  // ==========================================
  describe('useDistilleryDelete', () => {
    it('삭제 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useDistilleryDelete({ onSuccess }));

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'HAS_REFERENCES', '연관된 위스키가 있어 삭제할 수 없습니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useDistilleryDelete());

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
