import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError } from '@/test/mocks/data';
import {
  useBannerList,
  useBannerDetail,
  useBannerCreate,
  useBannerUpdate,
  useBannerDelete,
  useBannerUpdateStatus,
  useBannerUpdateSortOrder,
} from '../useBanners';

const BASE = '/admin/api/v1/banners';

describe('useBanners hooks', () => {
  // ==========================================
  // useBannerList
  // ==========================================
  describe('useBannerList', () => {
    it('목록 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useBannerList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items.length).toBeGreaterThan(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() => useBannerList({ keyword: '큐레이션' }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.name).toBe('신년 큐레이션 배너');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useBannerList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useBannerDetail
  // ==========================================
  describe('useBannerDetail', () => {
    it('id가 undefined이면 쿼리가 비활성화된다', () => {
      const { result } = renderHook(() => useBannerDetail(undefined));
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('상세 데이터를 반환한다', async () => {
      const { result } = renderHook(() => useBannerDetail(1));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.id).toBe(1);
      expect(result.current.data!.name).toBe('신년 큐레이션 배너');
      expect(result.current.data!.textPosition).toBe('RT');
    });

    it('존재하지 않는 ID는 에러 상태가 된다', async () => {
      const { result } = renderHook(() => useBannerDetail(9999));

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useBannerCreate
  // ==========================================
  describe('useBannerCreate', () => {
    it('생성 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBannerCreate({ onSuccess }));

      result.current.mutate({
        name: '새 배너',
        nameFontColor: '#ffffff',
        descriptionA: '설명A',
        descriptionB: '설명B',
        descriptionFontColor: '#ffffff',
        imageUrl: 'https://example.com/new.jpg',
        textPosition: 'CENTER',
        targetUrl: '/test',
        isExternalUrl: false,
        bannerType: 'AD',
        isActive: true,
        startDate: null,
        endDate: null,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.post(BASE, () => {
          return HttpResponse.json(
            wrapApiError(400, 'INVALID_REQUEST', '잘못된 요청입니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useBannerCreate());

      result.current.mutate({
        name: '',
        nameFontColor: '#ffffff',
        descriptionA: '',
        descriptionB: '',
        descriptionFontColor: '#ffffff',
        imageUrl: '',
        textPosition: 'RT',
        targetUrl: '',
        isExternalUrl: false,
        bannerType: 'AD',
        isActive: true,
        startDate: null,
        endDate: null,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useBannerUpdate
  // ==========================================
  describe('useBannerUpdate', () => {
    it('수정 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBannerUpdate({ onSuccess }));

      result.current.mutate({
        id: 1,
        data: {
          name: '수정된 배너',
          nameFontColor: '#000000',
          descriptionA: '수정A',
          descriptionB: '수정B',
          descriptionFontColor: '#000000',
          imageUrl: 'https://example.com/updated.jpg',
          textPosition: 'LB',
          targetUrl: '/updated',
          isExternalUrl: false,
          bannerType: 'CURATION',
          sortOrder: 0,
          startDate: null,
          endDate: null,
          isActive: true,
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ==========================================
  // useBannerDelete
  // ==========================================
  describe('useBannerDelete', () => {
    it('삭제 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBannerDelete({ onSuccess }));

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });

    it('에러 시 에러 상태가 된다', async () => {
      server.use(
        http.delete(`${BASE}/:bannerId`, () => {
          return HttpResponse.json(
            wrapApiError(400, 'BANNER_IN_USE', '사용 중인 배너는 삭제할 수 없습니다.'),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useBannerDelete());

      result.current.mutate(1);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  // ==========================================
  // useBannerUpdateStatus
  // ==========================================
  describe('useBannerUpdateStatus', () => {
    it('상태 변경 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBannerUpdateStatus({ onSuccess }));

      result.current.mutate({ bannerId: 1, data: { isActive: false } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // ==========================================
  // useBannerUpdateSortOrder
  // ==========================================
  describe('useBannerUpdateSortOrder', () => {
    it('정렬순서 변경 mutation이 성공한다', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBannerUpdateSortOrder({ onSuccess }));

      result.current.mutate({ bannerId: 1, data: { sortOrder: 5 } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
