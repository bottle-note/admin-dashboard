import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockTastingGroupItems, wrapApiError } from '@/test/mocks/data';
import { tastingGroupService } from '../tasting-group.service';

const BASE = '/admin/api/v1/tasting/groups';

describe('tastingGroupService', () => {
  describe('list()', () => {
    it('그룹 목록과 계열 목록을 반환한다', async () => {
      const result = await tastingGroupService.list();

      expect(result.groups).toHaveLength(mockTastingGroupItems.length);
      expect(result.groups[0]!.code).toBe('PEAT_SMOKE');
      expect(result.groups[0]!.tags[0]!.role.code).toBe('CORE');
      expect(result.families).toEqual(['스모키', '과일']);
    });
  });

  describe('delete()', () => {
    it('태그가 연결된 그룹이면 409 오류 메시지를 담아 throw한다', async () => {
      server.use(
        http.delete(`${BASE}/PEAT_SMOKE`, () =>
          HttpResponse.json(
            wrapApiError(
              409,
              'TASTING_TAG_GROUP_HAS_TAGS',
              '태그가 연결된 맛 그룹은 삭제할 수 없습니다.'
            ),
            { status: 409 }
          )
        )
      );

      await expect(tastingGroupService.delete('PEAT_SMOKE')).rejects.toThrow(
        '태그가 연결된 맛 그룹은 삭제할 수 없습니다.'
      );
    });
  });

  describe('ungroupedTags()', () => {
    it('keyword로 미소속 태그를 필터링해 반환한다', async () => {
      const all = await tastingGroupService.ungroupedTags();
      const filtered = await tastingGroupService.ungroupedTags({ keyword: '민트' });

      expect(all).toHaveLength(2);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.korName).toBe('민트');
    });
  });
});
