import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderHook } from '@/test/test-utils';
import { wrapApiError } from '@/test/mocks/data';
import { useAdminAlcoholList, useCategoryReferences } from '../useAdminAlcohols';
import { getCategoryGroup } from '@/types/api/alcohol.api';

const BASE = '/admin/api/v1/alcohols';

describe('useAdminAlcohols hooks', () => {
  // ==========================================
  // useAdminAlcoholList
  // ==========================================
  describe('useAdminAlcoholList', () => {
    it('목록 데이터를 반환한다 (삭제 데이터 제외)', async () => {
      const { result } = renderHook(() => useAdminAlcoholList());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // 기본 조회: 삭제된 위스키(ID 30)는 제외
      expect(result.current.data!.items.length).toBe(2);
      expect(result.current.data!.items.every((item) => item.deletedAt === null)).toBe(true);
    });

    it('includeDeleted=true 시 삭제된 데이터도 포함한다', async () => {
      const { result } = renderHook(() =>
        useAdminAlcoholList({ includeDeleted: true })
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // 삭제 포함: 3개 모두 반환
      expect(result.current.data!.items.length).toBe(3);
      const deletedItem = result.current.data!.items.find((item) => item.alcoholId === 30);
      expect(deletedItem).toBeDefined();
      expect(deletedItem!.deletedAt).not.toBeNull();
    });

    it('keyword로 필터링한다', async () => {
      const { result } = renderHook(() =>
        useAdminAlcoholList({ keyword: '글렌피딕' })
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.items).toHaveLength(1);
      expect(result.current.data!.items[0]!.korName).toBe('글렌피딕 12년');
    });

    it('API 에러 시 에러 상태가 된다', async () => {
      server.use(
        http.get(BASE, () => {
          return HttpResponse.json(wrapApiError(500, 'SERVER_ERROR', '서버 오류'), {
            status: 500,
          });
        })
      );

      const { result } = renderHook(() => useAdminAlcoholList());

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('페이지네이션 메타 정보를 반환한다', async () => {
      const { result } = renderHook(() => useAdminAlcoholList({ page: 0, size: 10 }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.meta).toBeDefined();
      expect(result.current.data!.meta.page).toBe(0);
      expect(result.current.data!.meta.totalElements).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // useCategoryReferences
  // ==========================================
  describe('useCategoryReferences', () => {
    it('카테고리 레퍼런스 목록을 반환한다', async () => {
      const { result } = renderHook(() => useCategoryReferences());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data!.length).toBeGreaterThan(0);
    });

});

  // ==========================================
  // getCategoryGroup (프론트엔드 매핑)
  // ==========================================
  describe('getCategoryGroup', () => {
    it('메인 카테고리를 올바른 그룹으로 매핑한다', () => {
      expect(getCategoryGroup('싱글 몰트')).toBe('SINGLE_MALT');
      expect(getCategoryGroup('블렌디드')).toBe('BLEND');
      expect(getCategoryGroup('블렌디드 몰트')).toBe('BLENDED_MALT');
      expect(getCategoryGroup('버번')).toBe('BOURBON');
      expect(getCategoryGroup('라이')).toBe('RYE');
    });

    it('싱글몰트 알코올 변형도 SINGLE_MALT로 매핑한다', () => {
      expect(getCategoryGroup('싱글몰트 알코올')).toBe('SINGLE_MALT');
    });

    it('기타 하위 카테고리는 OTHER로 매핑한다', () => {
      expect(getCategoryGroup('테네시')).toBe('OTHER');
      expect(getCategoryGroup('싱글 그레인')).toBe('OTHER');
      expect(getCategoryGroup('싱글 팟 스틸')).toBe('OTHER');
      expect(getCategoryGroup('위트')).toBe('OTHER');
      expect(getCategoryGroup('콘')).toBe('OTHER');
      expect(getCategoryGroup('스피릿')).toBe('OTHER');
    });

    it('알 수 없는 카테고리도 OTHER로 매핑한다', () => {
      expect(getCategoryGroup('새로운카테고리')).toBe('OTHER');
    });
  });
});
