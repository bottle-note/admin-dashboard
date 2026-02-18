import { describe, it, expect, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from '@/test/test-utils';
import { useReorderDrag } from '../useReorderDrag';

// 최소 DragEvent 모의 객체
const makeDragEvent = () =>
  ({
    dataTransfer: { effectAllowed: '' },
    preventDefault: vi.fn(),
  } as unknown as React.DragEvent);

// 테스트용 아이템 (order 필드로 순서 추적)
const ITEMS = [
  { id: 1, order: 0 },
  { id: 2, order: 1 },
  { id: 3, order: 2 },
];

function makeDefaultHook(overrides: {
  onReorder?: ReturnType<typeof vi.fn>;
  onAfterReorder?: ReturnType<typeof vi.fn>;
  pageOffset?: number;
} = {}) {
  const onReorder = overrides.onReorder ?? vi.fn().mockResolvedValue(undefined);
  const onAfterReorder = overrides.onAfterReorder ?? vi.fn().mockResolvedValue(undefined);

  const hook = renderHook(() =>
    useReorderDrag({
      items: ITEMS,
      getOrder: (item) => item.order,
      onReorder,
      onAfterReorder,
      pageOffset: overrides.pageOffset,
    })
  );

  return { ...hook, onReorder, onAfterReorder };
}

describe('useReorderDrag', () => {
  // ==========================================
  // 초기 상태
  // ==========================================
  describe('초기 상태', () => {
    it('isReorderMode가 false로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.isReorderMode).toBe(false);
    });

    it('isReordering이 false로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.isReordering).toBe(false);
    });

    it('dragOverId가 null로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.dragOverId).toBeNull();
    });
  });

  // ==========================================
  // toggleReorderMode
  // ==========================================
  describe('toggleReorderMode', () => {
    it('호출 시 순서 변경 모드가 활성화된다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());

      expect(result.current.isReorderMode).toBe(true);
    });

    it('두 번 호출 시 비활성화된다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      act(() => result.current.toggleReorderMode());

      expect(result.current.isReorderMode).toBe(false);
    });

    it('비활성화 시 dragOverId가 초기화된다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      // dragOverId 세팅
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));
      expect(result.current.dragOverId).toBe(1);

      // 모드 종료
      act(() => result.current.toggleReorderMode());
      expect(result.current.dragOverId).toBeNull();
    });
  });

  // ==========================================
  // getDragHandlers
  // ==========================================
  describe('getDragHandlers', () => {
    it('isReorderMode가 false면 draggable이 false다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.getDragHandlers(ITEMS[0]!).draggable).toBe(false);
    });

    it('isReorderMode가 true면 draggable이 true다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.toggleReorderMode());
      expect(result.current.getDragHandlers(ITEMS[0]!).draggable).toBe(true);
    });

    it('onDragOver 호출 시 dragOverId가 해당 아이템 id로 설정된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.toggleReorderMode());

      act(() => result.current.getDragHandlers(ITEMS[1]!).onDragOver(makeDragEvent()));

      expect(result.current.dragOverId).toBe(ITEMS[1]!.id);
    });

    it('onDragLeave 호출 시 dragOverId가 초기화된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragLeave());

      expect(result.current.dragOverId).toBeNull();
    });

    it('onDragEnd 호출 시 dragOverId가 초기화된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragEnd());

      expect(result.current.dragOverId).toBeNull();
    });
  });

  // ==========================================
  // 드롭 성공
  // ==========================================
  describe('드롭 성공', () => {
    it('영향받는 범위 항목의 순서를 업데이트한다', async () => {
      const { result, onReorder } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      // items[0]을 드래그
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      // items[2]에 드롭 → 0,1,2 모두 영향받음
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[2]!).onDrop(makeDragEvent());
      });

      expect(onReorder).toHaveBeenCalledTimes(3);
    });

    it('드롭 성공 후 onAfterReorder를 호출한다', async () => {
      const { result, onAfterReorder } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      expect(onAfterReorder).toHaveBeenCalledTimes(1);
    });

    it('드롭 완료 후 isReordering이 false가 된다', async () => {
      const { result } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      expect(result.current.isReordering).toBe(false);
    });

    it('pageOffset이 새 순서 계산에 반영된다', async () => {
      const { result, onReorder } = makeDefaultHook({ pageOffset: 20 });

      act(() => result.current.toggleReorderMode());
      // items[0](id=1)을 items[1](id=2)로 드래그
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      // 재정렬 후: [items[1], items[0], ...], 영향 범위 minIndex=0
      // idx=0: id=2 → 20+0+0=20
      // idx=1: id=1 → 20+0+1=21
      expect(onReorder).toHaveBeenNthCalledWith(1, ITEMS[1]!.id, 20);
      expect(onReorder).toHaveBeenNthCalledWith(2, ITEMS[0]!.id, 21);
    });
  });

  // ==========================================
  // 드롭 실패 → 롤백
  // ==========================================
  describe('드롭 실패 시 롤백', () => {
    it('onReorder 실패 시 원래 순서로 롤백을 시도한다', async () => {
      let callCount = 0;
      const onReorder = vi.fn().mockImplementation(() => {
        callCount++;
        // 첫 번째 호출만 실패
        if (callCount === 1) return Promise.reject(new Error('API 실패'));
        return Promise.resolve();
      });
      const { result } = makeDefaultHook({ onReorder });

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      // 첫 번째(실패) + 롤백 호출들
      expect(onReorder.mock.calls.length).toBeGreaterThan(1);
    });

    it('롤백 후 onAfterReorder를 한 번 호출한다', async () => {
      const onReorder = vi.fn().mockRejectedValue(new Error('API 실패'));
      const { result, onAfterReorder } = makeDefaultHook({ onReorder });

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      expect(onAfterReorder).toHaveBeenCalledTimes(1);
    });

    it('롤백 후 isReordering이 false가 된다', async () => {
      const onReorder = vi.fn().mockRejectedValue(new Error('API 실패'));
      const { result } = makeDefaultHook({ onReorder });

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      expect(result.current.isReordering).toBe(false);
    });
  });

  // ==========================================
  // 엣지 케이스
  // ==========================================
  describe('엣지 케이스', () => {
    it('같은 아이템으로 드롭하면 onReorder를 호출하지 않는다', async () => {
      const { result, onReorder, onAfterReorder } = makeDefaultHook();

      act(() => result.current.toggleReorderMode());
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      await act(async () => {
        // 같은 아이템에 드롭
        await result.current.getDragHandlers(ITEMS[0]!).onDrop(makeDragEvent());
      });

      expect(onReorder).not.toHaveBeenCalled();
      expect(onAfterReorder).not.toHaveBeenCalled();
    });

    it('isReorderMode가 false일 때 드롭해도 onReorder를 호출하지 않는다', async () => {
      const { result, onReorder } = makeDefaultHook();

      // 모드 활성화 없이 드롭
      await act(async () => {
        await result.current.getDragHandlers(ITEMS[1]!).onDrop(makeDragEvent());
      });

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('isReorderMode가 false일 때 onDragOver를 호출해도 dragOverId가 변하지 않는다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      expect(result.current.dragOverId).toBeNull();
    });
  });
});
