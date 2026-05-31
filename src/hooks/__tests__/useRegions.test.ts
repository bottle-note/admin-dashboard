import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError, wrapApiResponse } from '@/test/mocks/data';
import {
  useRegionCreate,
  useRegionDelete,
  useRegionDetail,
  useRegionList,
  useRegionUpdate,
  useRegionBulkReorder,
} from '../useRegions';

const BASE = '/admin/api/v1/regions';

describe('useRegions hooks', () => {
  describe('useRegionList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useRegionList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() => useRegionList({ keyword: '스페이사이드' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.korName).toBe('스페이사이드');
    });

    it('sortOrder DESC로 정렬한다', async () => {
      const { result } = renderHook(() => useRegionList({ sortOrder: 'DESC' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items[0]!.korName).toBe('미국');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useRegionList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRegionDetail', () => {
    it('id가 undefined이면 쿼리가 비활성화된다', () => {
      const { result } = renderHook(() => useRegionDetail(undefined));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('상세 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useRegionDetail(1));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.id).toBe(1);
      expect(result.current.data!.korName).toBe('스코틀랜드');
      expect(result.current.data!.sortOrder).toBe(0);
      expect(result.current.data!.hasChildren).toBe(true);
    });

    it('id가 0이어도 상세 쿼리를 실행한다', async () => {
      server.use(
        http.get(`${BASE}/0`, () => {
          return HttpResponse.json(
            wrapApiResponse({
              id: 0,
              korName: '-',
              engName: '-',
              continent: null,
              description: null,
              sortOrder: 21,
              parentId: null,
              parentKorName: null,
              hasChildren: false,
              alcoholCount: 0,
              createAt: '2024-01-01T00:00:00',
              lastModifyAt: '2024-06-01T00:00:00',
            })
          );
        })
      );

      const { result } = renderHook(() => useRegionDetail(0));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data!.id).toBe(0);
    });

    it('존재하지 않는 ID는 에러 상태가 된다', async () => {
      const { result } = renderHook(() => useRegionDetail(9999));

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRegionCreate', () => {
    it('생성 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useRegionCreate({ onSuccess }));

      result.current.mutate({
        korName: '일본',
        engName: 'Japan',
        continent: '아시아',
        description: null,
        parentId: null,
        sortOrder: 9999,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.post(BASE, () => {
          return HttpResponse.json(
            wrapApiError(400, 'DUPLICATE_NAME', '이미 존재하는 지역명입니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useRegionCreate());

      result.current.mutate({
        korName: '스코틀랜드',
        engName: 'Scotland',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRegionUpdate', () => {
    it('수정 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useRegionUpdate({ onSuccess }));

      result.current.mutate({
        id: 1,
        data: {
          korName: '스코틀랜드 수정',
          engName: 'Scotland Updated',
          sortOrder: 0,
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('useRegionDelete', () => {
    it('삭제 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useRegionDelete({ onSuccess }));

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'REGION_HAS_CHILDREN', '하위 지역이 있어 삭제할 수 없습니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useRegionDelete());

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRegionBulkReorder', () => {
    it('일괄 정렬순서 변경 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useRegionBulkReorder({ onSuccess }));

      result.current.mutate({ ids: [2, 1] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.patch(`${BASE}/bulk/reorder`, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), { status: 500 });
        })
      );

      const { result } = renderHook(() => useRegionBulkReorder());

      result.current.mutate({ ids: [2, 1] });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
