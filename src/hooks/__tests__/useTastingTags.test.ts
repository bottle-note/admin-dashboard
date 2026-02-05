import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import {
  wrapApiError,
} from '@/test/mocks/data';
import {
  useTastingTagList,
  useTastingTagDetail,
  useTastingTagCreate,
  useTastingTagUpdate,
  useTastingTagDelete,
  useTastingTagConnectAlcohols,
  useTastingTagDisconnectAlcohols,
} from '../useTastingTags';

const BASE = '/admin/api/v1/tasting-tags';

describe('useTastingTags hooks', () => {
  // ==========================================
  // useTastingTagList
  // ==========================================
  describe('useTastingTagList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useTastingTagList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() => useTastingTagList({ keyword: '바닐라' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.korName).toBe('바닐라');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useTastingTagList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useTastingTagDetail
  // ==========================================
  describe('useTastingTagDetail', () => {
    it('id가 undefined이면 쿼리가 비활성화된다', () => {
      const { result } = renderHook(() => useTastingTagDetail(undefined));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('상세 데이터를 반환한다 (태그 + 연관 위스키)', async () => {
      const { result } = renderHook(() => useTastingTagDetail(1));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.tag.id).toBe(1);
      expect(result.current.data!.tag.korName).toBe('바닐라');
      expect(result.current.data!.tag.children).toHaveLength(1);
      expect(result.current.data!.alcohols).toHaveLength(2);
    });

    it('존재하지 않는 ID는 에러 상태가 된다', async () => {
      const { result } = renderHook(() => useTastingTagDetail(9999));

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useTastingTagCreate
  // ==========================================
  describe('useTastingTagCreate', () => {
    it('생성 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTastingTagCreate({ onSuccess }));

      result.current.mutate({
        korName: '새 태그',
        engName: 'New Tag',
        icon: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.post(BASE, () => {
          return HttpResponse.json(
            wrapApiError(400, 'DUPLICATE_NAME', '이미 존재하는 태그명입니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useTastingTagCreate());

      result.current.mutate({
        korName: '바닐라',
        engName: 'Vanilla',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useTastingTagUpdate
  // ==========================================
  describe('useTastingTagUpdate', () => {
    it('수정 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTastingTagUpdate({ onSuccess }));

      result.current.mutate({
        id: 1,
        data: { korName: '수정됨', engName: 'Updated' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ==========================================
  // useTastingTagDelete
  // ==========================================
  describe('useTastingTagDelete', () => {
    it('삭제 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTastingTagDelete({ onSuccess }));

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('자식 태그 있으면 에러가 된다', async () => {
      server.use(
        http.delete(`${BASE}/:id`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'HAS_CHILDREN', '자식 태그가 있습니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useTastingTagDelete());

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useTastingTagConnectAlcohols
  // ==========================================
  describe('useTastingTagConnectAlcohols', () => {
    it('위스키 연결 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useTastingTagConnectAlcohols({ onSuccess })
      );

      result.current.mutate({ tagId: 1, alcoholIds: [10, 20] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.post(`${BASE}/:id/alcohols`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'ALREADY_CONNECTED', '이미 연결됨'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useTastingTagConnectAlcohols());

      result.current.mutate({ tagId: 1, alcoholIds: [10] });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useTastingTagDisconnectAlcohols
  // ==========================================
  describe('useTastingTagDisconnectAlcohols', () => {
    it('위스키 연결 해제 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useTastingTagDisconnectAlcohols({ onSuccess })
      );

      result.current.mutate({ tagId: 1, alcoholIds: [10] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.delete(`${BASE}/:id/alcohols`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'NOT_CONNECTED', '연결 안됨'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useTastingTagDisconnectAlcohols());

      result.current.mutate({ tagId: 1, alcoholIds: [999] });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
